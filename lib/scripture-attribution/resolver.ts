import fs from 'node:fs'
import path from 'node:path'
import type { AnnotationTarget, ScriptureAttribution, TextRangePoint } from '../../types/scripture.ts'
import { getScripturePersonProfile } from './catalog.ts'
import {
  SCRIPTURE_ATTRIBUTION_RULES,
  SCRIPTURE_BOOK_DEFAULTS,
  toStoredAttribution,
  type AttributionRulePoint,
  type ScriptureAttributionRule,
} from './rules.ts'

export interface AttributionTextUnit {
  unit: number
  text: string
}

export class InvalidAttributionTargetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAttributionTargetError'
  }
}

function sourcePath(target: AnnotationTarget) {
  return target.kind === 'scripture'
    ? path.join(process.cwd(), 'lib', 'scripture_data', 'chapters', target.bookId, `chapter_${target.chapterNumber}.json`)
    : path.join(process.cwd(), 'lib', 'scripture_data', 'intro_material', `${target.introId}.json`)
}

/** Loads the same text that the readers use, with the same unit identifiers. */
export function loadAttributionTextUnits(target: AnnotationTarget): AttributionTextUnit[] {
  const filePath = sourcePath(target)
  if (!fs.existsSync(filePath)) throw new InvalidAttributionTargetError(`Scripture source does not exist: ${filePath}`)

  const source = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    verses?: Array<{ number: number; text: string }>
    paragraphs?: string[]
  }
  const units = target.kind === 'scripture'
    ? source.verses?.map(({ number, text }) => ({ unit: number, text }))
    : source.paragraphs?.map((text, unit) => ({ unit, text }))

  if (!units?.length) throw new InvalidAttributionTargetError(`Scripture source has no selectable text: ${filePath}`)
  return units
}

function comparePoints(a: TextRangePoint, b: TextRangePoint) {
  return a.unit - b.unit || a.offset - b.offset
}

function quoteFromTarget(units: AttributionTextUnit[], start: TextRangePoint, end: TextRangePoint) {
  return units
    .filter((unit) => unit.unit >= start.unit && unit.unit <= end.unit)
    .map((unit) => unit.text.slice(unit.unit === start.unit ? start.offset : 0, unit.unit === end.unit ? end.offset : unit.text.length))
    .join('\n\n')
}

export function validateAnnotationTargetCoordinates(target: AnnotationTarget): AttributionTextUnit[] {
  const units = loadAttributionTextUnits(target)
  const unitById = new Map(units.map((unit) => [unit.unit, unit]))
  const startUnit = unitById.get(target.start.unit)
  const endUnit = unitById.get(target.end.unit)
  if (!startUnit || !endUnit) throw new InvalidAttributionTargetError('Selection references a missing scripture unit')
  if (target.start.offset > startUnit.text.length || target.end.offset > endUnit.text.length) {
    throw new InvalidAttributionTargetError('Selection offset exceeds the source text')
  }
  if (comparePoints(target.start, target.end) >= 0) throw new InvalidAttributionTargetError('Selection must have a positive range')

  const computedQuote = quoteFromTarget(units, target.start, target.end)
  if (computedQuote !== target.quote.exact) {
    throw new InvalidAttributionTargetError('Selection quote does not match the source text at its saved coordinates')
  }
  return units
}

function ruleMatchesTarget(rule: ScriptureAttributionRule, target: AnnotationTarget) {
  return rule.target.kind === target.kind
    && (target.kind === 'scripture'
      ? rule.target.bookId === target.bookId && rule.target.chapterNumber === target.chapterNumber
      : rule.target.introId === target.introId)
}

function resolveRulePoint(point: AttributionRulePoint, units: AttributionTextUnit[], edge: 'start' | 'end'): TextRangePoint {
  const chosen = point.unit === Number.MAX_SAFE_INTEGER
    ? (edge === 'end' ? units.at(-1) : units[0])
    : units.find((unit) => unit.unit === point.unit)
  if (!chosen) throw new InvalidAttributionTargetError(`Rule references missing unit ${point.unit}`)
  const offset = point.offset === 'end' ? chosen.text.length : (point.offset ?? 0)
  if (offset < 0 || offset > chosen.text.length) throw new InvalidAttributionTargetError(`Rule offset is out of range for unit ${chosen.unit}`)
  return { unit: chosen.unit, offset }
}

interface ActiveRule {
  rule: ScriptureAttributionRule
  start: TextRangePoint
  end: TextRangePoint
}

function clippedRuleSegments(rule: ActiveRule, selectedStart: TextRangePoint, selectedEnd: TextRangePoint, units: AttributionTextUnit[]) {
  const segments: Array<{ unit: AttributionTextUnit; start: number; end: number }> = []
  for (const unit of units) {
    if (unit.unit < selectedStart.unit || unit.unit > selectedEnd.unit) continue
    if (unit.unit < rule.start.unit || unit.unit > rule.end.unit) continue
    const start = Math.max(
      unit.unit === selectedStart.unit ? selectedStart.offset : 0,
      unit.unit === rule.start.unit ? rule.start.offset : 0,
    )
    const end = Math.min(
      unit.unit === selectedEnd.unit ? selectedEnd.offset : unit.text.length,
      unit.unit === rule.end.unit ? rule.end.offset : unit.text.length,
    )
    if (start < end) segments.push({ unit, start, end })
  }
  return segments
}

function defaultForTarget(target: AnnotationTarget): ScriptureAttribution | undefined {
  if (target.kind === 'intro') return toStoredAttribution({ primaryProfileId: 'church-editorial', basis: 'editorial' })
  const fallback = SCRIPTURE_BOOK_DEFAULTS[target.bookId]
  return fallback ? toStoredAttribution(fallback) : undefined
}

function attributionKey(attribution: ScriptureAttribution) {
  return [attribution.primaryProfileId, attribution.secondaryProfileId ?? '', attribution.relation ?? '', attribution.basis].join('|')
}

export interface AttributionCoverage {
  attribution: ScriptureAttribution
  characters: number
}

/** Returns the fallback whenever the largest two source coverages tie. */
export function chooseAttributionByCoverage(coverage: Iterable<AttributionCoverage>, fallback: ScriptureAttribution): ScriptureAttribution {
  const ranked = [...coverage].sort((a, b) => b.characters - a.characters || attributionKey(a.attribution).localeCompare(attributionKey(b.attribution)))
  if (!ranked.length || (ranked[1] && ranked[0].characters === ranked[1].characters)) return fallback
  return ranked[0].attribution
}

/**
 * Resolve exactly one source identity for a target.  Rules are measured by the
 * number of selected source characters they cover, so cross-verse selections
 * remain deterministic.
 */
export function resolveScriptureAttribution(target: AnnotationTarget): ScriptureAttribution {
  const units = validateAnnotationTargetCoordinates(target)
  const fallback = defaultForTarget(target)
  if (!fallback) throw new InvalidAttributionTargetError(`No attribution default exists for this target`)

  const activeRules = SCRIPTURE_ATTRIBUTION_RULES
    .filter((rule) => ruleMatchesTarget(rule, target))
    .map((rule) => ({
      rule,
      start: resolveRulePoint(rule.target.start, units, 'start'),
      end: resolveRulePoint(rule.target.end, units, 'end'),
    }))
    .filter(({ start, end }) => comparePoints(start, end) < 0)

  const coverage = new Map<string, AttributionCoverage>()
  const addCoverage = (entry: ScriptureAttribution, characters: number) => {
    const key = attributionKey(entry)
    const current = coverage.get(key)
    if (current) current.characters += characters
    else coverage.set(key, { attribution: entry, characters })
  }

  for (const unit of units) {
    if (unit.unit < target.start.unit || unit.unit > target.end.unit) continue
    const selectedStart = unit.unit === target.start.unit ? target.start.offset : 0
    const selectedEnd = unit.unit === target.end.unit ? target.end.offset : unit.text.length
    if (selectedStart >= selectedEnd) continue

    const boundaries = new Set<number>([selectedStart, selectedEnd])
    const ruleSegments = activeRules.flatMap((active) => clippedRuleSegments(active, target.start, target.end, [unit]).map((segment) => ({ active, segment })))
    for (const { segment } of ruleSegments) {
      boundaries.add(segment.start)
      boundaries.add(segment.end)
    }

    const ordered = [...boundaries].sort((a, b) => a - b)
    for (let index = 0; index < ordered.length - 1; index++) {
      const start = ordered[index]
      const end = ordered[index + 1]
      if (start >= end) continue
      const highest = ruleSegments
        .filter(({ segment }) => segment.start < end && segment.end > start)
        .sort((a, b) => b.active.rule.priority - a.active.rule.priority || a.active.rule.id.localeCompare(b.active.rule.id))[0]
      addCoverage(highest ? toStoredAttribution(highest.active.rule.attribution) : fallback, end - start)
    }
  }

  return chooseAttributionByCoverage(coverage.values(), fallback)
}

export function validateScriptureAttributionRules() {
  const failures: string[] = []
  for (const rule of SCRIPTURE_ATTRIBUTION_RULES) {
    if (!getScripturePersonProfile(rule.attribution.primaryProfileId)) failures.push(`${rule.id}: primary profile is missing`)
    if (rule.attribution.secondaryProfileId && !getScripturePersonProfile(rule.attribution.secondaryProfileId)) failures.push(`${rule.id}: secondary profile is missing`)
    try {
      const target = rule.target.kind === 'scripture'
        ? { kind: 'scripture' as const, sourceVersion: 'book-of-mormon-local-v1' as const, bookId: rule.target.bookId!, chapterNumber: rule.target.chapterNumber!, start: { unit: 1, offset: 0 }, end: { unit: 1, offset: 1 }, quote: { exact: 'x' } }
        : { kind: 'intro' as const, sourceVersion: 'book-of-mormon-local-v1' as const, introId: rule.target.introId!, start: { unit: 0, offset: 0 }, end: { unit: 0, offset: 1 }, quote: { exact: 'x' } }
      const units = loadAttributionTextUnits(target)
      const start = resolveRulePoint(rule.target.start, units, 'start')
      const end = resolveRulePoint(rule.target.end, units, 'end')
      if (comparePoints(start, end) >= 0) failures.push(`${rule.id}: range is empty or reversed`)
    } catch (error) {
      failures.push(`${rule.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return failures
}
