import type { Annotation, AnnotationTarget, HighlightColor, TextRangePoint } from '../../types/scripture.ts'

export interface TextUnit {
  unit: number
  text: string
  label?: string
}

export interface DraftHighlight {
  start: TextRangePoint
  end: TextRangePoint
  color: HighlightColor
}

export interface HighlightSegment {
  start: number
  end: number
  text: string
  annotations: Annotation[]
  draft: boolean
}

export function comparePoints(a: TextRangePoint, b: TextRangePoint) {
  return a.unit - b.unit || a.offset - b.offset
}

export function normalizeRange(start: TextRangePoint, end: TextRangePoint) {
  return comparePoints(start, end) <= 0 ? { start, end } : { start: end, end: start }
}

export function targetContainsUnit(target: Pick<AnnotationTarget, 'start' | 'end'>, unit: number) {
  return target.start.unit <= unit && target.end.unit >= unit
}

export function clipTargetToUnit(target: Pick<AnnotationTarget, 'start' | 'end'>, unit: TextUnit) {
  if (!targetContainsUnit(target, unit.unit)) return null

  const start = target.start.unit === unit.unit ? target.start.offset : 0
  const end = target.end.unit === unit.unit ? target.end.offset : unit.text.length
  const clampedStart = Math.max(0, Math.min(start, unit.text.length))
  const clampedEnd = Math.max(0, Math.min(end, unit.text.length))

  return clampedStart < clampedEnd ? { start: clampedStart, end: clampedEnd } : null
}

export function segmentTextUnit(
  unit: TextUnit,
  annotations: Annotation[],
  draft?: DraftHighlight | null,
): HighlightSegment[] {
  const clipped = annotations.flatMap((annotation) => {
    if (!annotation.target) return []
    const range = clipTargetToUnit(annotation.target, unit)
    return range ? [{ annotation, ...range }] : []
  })

  const draftTarget = draft ? { start: draft.start, end: draft.end } : null
  const clippedDraft = draftTarget ? clipTargetToUnit(draftTarget, unit) : null

  const boundaries = new Set<number>([0, unit.text.length])
  clipped.forEach(({ start, end }) => {
    boundaries.add(start)
    boundaries.add(end)
  })
  if (clippedDraft) {
    boundaries.add(clippedDraft.start)
    boundaries.add(clippedDraft.end)
  }

  const sorted = [...boundaries].sort((a, b) => a - b)
  const segments: HighlightSegment[] = []

  for (let index = 0; index < sorted.length - 1; index++) {
    const start = sorted[index]
    const end = sorted[index + 1]
    if (start === end) continue

    segments.push({
      start,
      end,
      text: unit.text.slice(start, end),
      annotations: clipped
        .filter((range) => range.start < end && range.end > start)
        .map((range) => range.annotation),
      draft: Boolean(clippedDraft && clippedDraft.start < end && clippedDraft.end > start),
    })
  }

  return segments
}

export function getQuoteForRange(units: TextUnit[], start: TextRangePoint, end: TextRangePoint) {
  const normalized = normalizeRange(start, end)
  return units
    .filter((unit) => unit.unit >= normalized.start.unit && unit.unit <= normalized.end.unit)
    .map((unit) => {
      const sliceStart = unit.unit === normalized.start.unit ? normalized.start.offset : 0
      const sliceEnd = unit.unit === normalized.end.unit ? normalized.end.offset : unit.text.length
      return unit.text.slice(sliceStart, sliceEnd)
    })
    .join('\n\n')
}

export function sortAnnotationsByTarget(annotations: Annotation[]) {
  return [...annotations].sort((a, b) => {
    if (!a.target && !b.target) return 0
    if (!a.target) return 1
    if (!b.target) return -1
    return comparePoints(a.target.start, b.target.start) || comparePoints(a.target.end, b.target.end)
  })
}
