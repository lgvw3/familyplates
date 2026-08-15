import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import type { AnnotationTarget, TextRangePoint } from '../../types/scripture.ts'
import { getScripturePersonProfile, getScripturePersonProfileOrNull, SCRIPTURE_PERSON_PROFILES } from './catalog.ts'
import { validateScripturePortraitManifest } from './provenance.ts'
import {
  chooseAttributionByCoverage,
  InvalidAttributionTargetError,
  loadAttributionTextUnits,
  resolveScriptureAttribution,
  validateScriptureAttributionRules,
} from './resolver.ts'
import { getAssociatedPassagesForProfile, SCRIPTURE_ATTRIBUTION_RULES, SCRIPTURE_BOOK_DEFAULTS } from './rules.ts'
import { shouldBackfillScriptureAttribution } from './backfill.ts'

function targetFor(
  source: Omit<Extract<AnnotationTarget, { kind: 'scripture' }>, 'start' | 'end' | 'quote'>
    | Omit<Extract<AnnotationTarget, { kind: 'intro' }>, 'start' | 'end' | 'quote'>,
  start: TextRangePoint,
  end: TextRangePoint,
): AnnotationTarget {
  const target = { ...source, start, end, quote: { exact: '' } } as AnnotationTarget
  const units = loadAttributionTextUnits(target)
  target.quote.exact = units
    .filter((unit) => unit.unit >= start.unit && unit.unit <= end.unit)
    .map((unit) => unit.text.slice(unit.unit === start.unit ? start.offset : 0, unit.unit === end.unit ? end.offset : unit.text.length))
    .join('\n\n')
  return target
}

const scripture = (bookId: string, chapterNumber: number, start: TextRangePoint, end: TextRangePoint) => targetFor({
  kind: 'scripture', sourceVersion: 'book-of-mormon-local-v1', bookId, chapterNumber,
}, start, end)

const intro = (introId: string, start: TextRangePoint, end: TextRangePoint) => targetFor({
  kind: 'intro', sourceVersion: 'book-of-mormon-local-v1', introId,
}, start, end)

test('every static rule references an existing profile and local source range', () => {
  assert.deepEqual(validateScriptureAttributionRules(), [])
  for (const rule of SCRIPTURE_ATTRIBUTION_RULES) {
    assert.ok(getScripturePersonProfile(rule.attribution.primaryProfileId), rule.id)
    if (rule.attribution.secondaryProfileId) assert.ok(getScripturePersonProfile(rule.attribution.secondaryProfileId), rule.id)
  }
  for (const fallback of Object.values(SCRIPTURE_BOOK_DEFAULTS)) assert.ok(getScripturePersonProfile(fallback.primaryProfileId))
})

test('catalog lookup has null-safe and undefined variants', () => {
  assert.equal(getScripturePersonProfile('isaiah')?.name, 'Isaiah')
  assert.equal(getScripturePersonProfile('missing'), undefined)
  assert.equal(getScripturePersonProfileOrNull('missing'), null)
})

test('portrait provenance covers every catalog profile with a matching WebP asset', () => {
  assert.deepEqual(validateScripturePortraitManifest(SCRIPTURE_PERSON_PROFILES.map((profile) => profile.id)), [])
  for (const profile of SCRIPTURE_PERSON_PROFILES) {
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', profile.portraitPath)), `${profile.id} portrait asset is missing`)
    if (profile.portraitProvenance.kind === 'official') {
      assert.ok(profile.portraitProvenance.sourceUrl?.startsWith('https://www.churchofjesuschrist.org/'))
      assert.notEqual(profile.portraitProvenance.credit, 'AI-generated artistic depiction')
    }
    if (profile.portraitProvenance.kind === 'generated') {
      assert.equal(profile.portraitProvenance.credit, 'AI-generated artistic depiction')
      assert.ok(profile.portraitProvenance.generationPrompt)
    }
  }
})

test('quoted Isaiah text identifies Isaiah and the Nephi quote relationship', () => {
  const target = scripture('the-first-book-of-nephi', 20, { unit: 1, offset: 0 }, { unit: 1, offset: 12 })
  assert.deepEqual(resolveScriptureAttribution(target), {
    version: 1,
    ruleSetVersion: 'book-of-mormon-attribution-v1',
    primaryProfileId: 'isaiah',
    secondaryProfileId: 'nephi-son-of-lehi',
    relation: 'quoted-by',
    basis: 'quoted-source',
  })
})

test('an unreviewed Mosiah narration uses Mormon as the record author', () => {
  const target = scripture('the-book-of-mosiah', 1, { unit: 1, offset: 0 }, { unit: 1, offset: 12 })
  assert.equal(resolveScriptureAttribution(target).primaryProfileId, 'mormon-son-of-mormon')
})

test('Omni and Mormon recorder handoffs use the precise book boundaries', () => {
  const cases: Array<[number, string]> = [
    [1, 'omni-son-of-jarom'], [4, 'amaron-son-of-omni'], [9, 'chemish-brother-of-amaron'], [10, 'abinadom-son-of-chemish'], [12, 'amaleki-son-of-abinadom'],
  ]
  for (const [verse, profileId] of cases) {
    const target = scripture('the-book-of-omni', 1, { unit: verse, offset: 0 }, { unit: verse, offset: 1 })
    assert.equal(resolveScriptureAttribution(target).primaryProfileId, profileId)
  }
  assert.equal(resolveScriptureAttribution(scripture('the-book-of-mormon', 7, { unit: 1, offset: 0 }, { unit: 1, offset: 1 })).primaryProfileId, 'mormon-son-of-mormon')
  assert.equal(resolveScriptureAttribution(scripture('the-book-of-mormon', 8, { unit: 1, offset: 0 }, { unit: 1, offset: 1 })).primaryProfileId, 'moroni-son-of-mormon')
})

test('Alma sermon text shows Alma as recorded by Mormon', () => {
  const target = scripture('the-book-of-alma', 5, { unit: 3, offset: 0 }, { unit: 3, offset: 16 })
  const result = resolveScriptureAttribution(target)
  assert.equal(result.primaryProfileId, 'alma-the-younger')
  assert.equal(result.secondaryProfileId, 'mormon-son-of-mormon')
  assert.equal(result.relation, 'recorded-by')
})

test('quoted sources supersede an overlapping direct-speech rule', () => {
  const target = scripture('the-book-of-mosiah', 14, { unit: 1, offset: 0 }, { unit: 1, offset: 20 })
  const result = resolveScriptureAttribution(target)
  assert.equal(result.primaryProfileId, 'isaiah')
  assert.equal(result.secondaryProfileId, 'mormon-son-of-mormon')
  assert.equal(result.relation, 'quoted-by')
})

test('every first-wave profile has a high-confidence sample passage', () => {
  const samples: Array<[string, AnnotationTarget]> = [
    ['alma-the-elder', scripture('the-book-of-mosiah', 18, { unit: 8, offset: 0 }, { unit: 8, offset: 12 })],
    ['ammon-son-of-mosiah', scripture('the-book-of-alma', 18, { unit: 16, offset: 0 }, { unit: 16, offset: 12 })],
    ['aaron-son-of-mosiah', scripture('the-book-of-alma', 22, { unit: 8, offset: 0 }, { unit: 8, offset: 12 })],
    ['helaman-son-of-alma', scripture('the-book-of-alma', 56, { unit: 2, offset: 0 }, { unit: 2, offset: 12 })],
    ['captain-moroni', scripture('the-book-of-alma', 54, { unit: 5, offset: 0 }, { unit: 5, offset: 12 })],
    ['pahoran', scripture('the-book-of-alma', 61, { unit: 2, offset: 0 }, { unit: 2, offset: 12 })],
    ['ammoron', scripture('the-book-of-alma', 54, { unit: 16, offset: 0 }, { unit: 16, offset: 12 })],
    ['korihor', scripture('the-book-of-alma', 30, { unit: 13, offset: 0 }, { unit: 13, offset: 12 })],
    ['zeezrom', scripture('the-book-of-alma', 11, { unit: 26, offset: 0 }, { unit: 26, offset: 12 })],
    ['brother-of-jared', scripture('the-book-of-ether', 3, { unit: 2, offset: 0 }, { unit: 2, offset: 12 })],
    ['moses', scripture('the-book-of-mosiah', 13, { unit: 12, offset: 0 }, { unit: 12, offset: 12 })],
    ['neum', scripture('the-first-book-of-nephi', 19, { unit: 10, offset: 328 }, { unit: 10, offset: 379 })],
  ]
  for (const [profileId, target] of samples) assert.equal(resolveScriptureAttribution(target).primaryProfileId, profileId, profileId)
})

test('coverage selection uses the majority and returns the fallback for exact ties', () => {
  const fallback = resolveScriptureAttribution(scripture('the-book-of-mosiah', 1, { unit: 1, offset: 0 }, { unit: 1, offset: 12 }))
  const alma = resolveScriptureAttribution(scripture('the-book-of-alma', 5, { unit: 3, offset: 0 }, { unit: 3, offset: 12 }))
  assert.equal(chooseAttributionByCoverage([{ attribution: alma, characters: 8 }, { attribution: fallback, characters: 7 }], fallback).primaryProfileId, 'alma-the-younger')
  assert.deepEqual(chooseAttributionByCoverage([{ attribution: alma, characters: 7 }, { attribution: fallback, characters: 7 }], fallback), fallback)
})

test('introductory material has attribution, including the precise Joseph Smith quote', () => {
  const editorialTarget = intro('introduction', { unit: 0, offset: 0 }, { unit: 0, offset: 16 })
  assert.equal(resolveScriptureAttribution(editorialTarget).primaryProfileId, 'church-editorial')

  const josephTarget = intro('introduction', { unit: 5, offset: 55 }, { unit: 5, offset: 261 })
  const result = resolveScriptureAttribution(josephTarget)
  assert.equal(result.primaryProfileId, 'joseph-smith')
  assert.equal(result.secondaryProfileId, 'church-editorial')
  assert.equal(result.relation, 'quoted-by')
})

test('all seven intro sources have a deterministic attribution', () => {
  const cases: Array<[string, number, string]> = [
    ['title-page', 0, 'church-editorial'],
    ['title-page-of-the-book-of-mormon', 0, 'moroni-son-of-mormon'],
    ['introduction', 0, 'church-editorial'],
    ['testimony-of-three-witnesses', 0, 'three-witnesses'],
    ['testimony-of-eight-witnesses', 0, 'eight-witnesses'],
    ['testimony-of-the-prophet-joseph-smith', 1, 'joseph-smith'],
    ['brief-explanation-about-the-book-of-mormon', 0, 'church-editorial'],
  ]
  for (const [introId, unit, profileId] of cases) {
    const target = intro(introId, { unit, offset: 0 }, { unit, offset: 1 })
    assert.equal(resolveScriptureAttribution(target).primaryProfileId, profileId, introId)
  }
})

test('title page carries both the ancient author and its translation relationship', () => {
  const target = intro('title-page-of-the-book-of-mormon', { unit: 0, offset: 0 }, { unit: 0, offset: 12 })
  assert.deepEqual(resolveScriptureAttribution(target), {
    version: 1,
    ruleSetVersion: 'book-of-mormon-attribution-v1',
    primaryProfileId: 'moroni-son-of-mormon',
    secondaryProfileId: 'joseph-smith',
    relation: 'translated-by',
    basis: 'translation',
  })
})

test('individual witness signature lines resolve to the signer', () => {
  const target = intro('testimony-of-eight-witnesses', { unit: 7, offset: 0 }, { unit: 7, offset: 'Hyrum Smith'.length })
  assert.equal(resolveScriptureAttribution(target).primaryProfileId, 'hyrum-smith')
})

test('new saves reject a quote that does not match its exact local coordinates', () => {
  const target = scripture('the-book-of-mosiah', 1, { unit: 1, offset: 0 }, { unit: 1, offset: 12 })
  target.quote.exact = 'forged text'
  assert.throws(() => resolveScriptureAttribution(target), InvalidAttributionTargetError)
})

test('book defaults make associated passage lists available to every default author', () => {
  assert.ok(getAssociatedPassagesForProfile('jacob-brother-of-nephi').some((passage) => passage.ruleId === 'default:the-book-of-jacob:jacob-brother-of-nephi'))
})

test('backfill only schedules stale or missing attribution snapshots', () => {
  const current = resolveScriptureAttribution(scripture('the-book-of-mosiah', 1, { unit: 1, offset: 0 }, { unit: 1, offset: 12 }))
  assert.equal(shouldBackfillScriptureAttribution(undefined, current), true)
  assert.equal(shouldBackfillScriptureAttribution(current, current), false)
  assert.equal(shouldBackfillScriptureAttribution({ ...current, ruleSetVersion: 'old-rules' }, current), true)
})
