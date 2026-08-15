import type { ScriptureAttribution, ScriptureAttributionBasis, ScriptureAttributionRelation } from '../../types/scripture.ts'

export const SCRIPTURE_ATTRIBUTION_RULE_SET_VERSION = 'book-of-mormon-attribution-v1'

export type AttributionRulePoint = { unit: number; offset?: number | 'end' }

export interface ScriptureAttributionRule {
  id: string
  target: {
    kind: 'scripture' | 'intro'
    bookId?: string
    chapterNumber?: number
    introId?: string
    start: AttributionRulePoint
    end: AttributionRulePoint
  }
  attribution: Omit<ScriptureAttribution, 'version' | 'ruleSetVersion'>
  /** Higher values supersede lower values over the same characters. */
  priority: number
  evidence: string
}

type AttributionInput = {
  primaryProfileId: string
  secondaryProfileId?: string
  relation?: ScriptureAttributionRelation
  basis: ScriptureAttributionBasis
}

const attribution = (primaryProfileId: string, basis: ScriptureAttributionBasis, secondaryProfileId?: string, relation?: ScriptureAttributionRelation): AttributionInput => ({
  primaryProfileId,
  basis,
  ...(secondaryProfileId ? { secondaryProfileId } : {}),
  ...(relation ? { relation } : {}),
})

const wholeChapter = (bookId: string, chapterNumber: number, result: AttributionInput, evidence: string, priority = 100): ScriptureAttributionRule => ({
  id: `${bookId}:${chapterNumber}:${result.primaryProfileId}`,
  target: { kind: 'scripture', bookId, chapterNumber, start: { unit: 1, offset: 0 }, end: { unit: Number.MAX_SAFE_INTEGER, offset: 'end' } },
  attribution: result,
  priority,
  evidence,
})

const verses = (bookId: string, chapterNumber: number, from: number, to: number, result: AttributionInput, evidence: string, priority = 100): ScriptureAttributionRule => ({
  id: `${bookId}:${chapterNumber}:${from}-${to}:${result.primaryProfileId}`,
  target: { kind: 'scripture', bookId, chapterNumber, start: { unit: from, offset: 0 }, end: { unit: to, offset: 'end' } },
  attribution: result,
  priority,
  evidence,
})

const introParagraphs = (introId: string, from: number, to: number, result: AttributionInput, evidence: string, priority = 100): ScriptureAttributionRule => ({
  id: `${introId}:${from}-${to}:${result.primaryProfileId}`,
  target: { kind: 'intro', introId, start: { unit: from, offset: 0 }, end: { unit: to, offset: 'end' } },
  attribution: result,
  priority,
  evidence,
})

/**
 * Defaults deliberately favor the historical recorder.  Detailed rules below
 * replace them only where a named voice or quoted author has been reviewed.
 */
export const SCRIPTURE_BOOK_DEFAULTS: Record<string, AttributionInput> = {
  'the-first-book-of-nephi': attribution('nephi-son-of-lehi', 'record-author'),
  'the-second-book-of-nephi': attribution('nephi-son-of-lehi', 'record-author'),
  'the-book-of-jacob': attribution('jacob-brother-of-nephi', 'record-author'),
  'the-book-of-enos': attribution('enos-son-of-jacob', 'record-author'),
  'the-book-of-jarom': attribution('jarom-son-of-enos', 'record-author'),
  'the-book-of-omni': attribution('omni-son-of-jarom', 'record-author'),
  'the-words-of-mormon': attribution('mormon-son-of-mormon', 'record-author'),
  'the-book-of-mosiah': attribution('mormon-son-of-mormon', 'record-author'),
  'the-book-of-alma': attribution('mormon-son-of-mormon', 'record-author'),
  'the-book-of-helaman': attribution('mormon-son-of-mormon', 'record-author'),
  'third-nephi-the-book-of-nephi': attribution('mormon-son-of-mormon', 'record-author'),
  'fourth-nephi-the-book-of-nephi': attribution('mormon-son-of-mormon', 'record-author'),
  'the-book-of-mormon': attribution('mormon-son-of-mormon', 'record-author'),
  'the-book-of-ether': attribution('moroni-son-of-mormon', 'record-author'),
  'the-book-of-moroni': attribution('moroni-son-of-mormon', 'record-author'),
}

export const SCRIPTURE_ATTRIBUTION_RULES: ScriptureAttributionRule[] = [
  // The several writers preserved in Omni are a useful hard boundary test.
  verses('the-book-of-omni', 1, 4, 8, attribution('amaron-son-of-omni', 'record-author'), 'Amaron identifies himself in Omni 1:4.'),
  verses('the-book-of-omni', 1, 9, 9, attribution('chemish-brother-of-amaron', 'record-author'), 'Chemish identifies himself in Omni 1:9.'),
  verses('the-book-of-omni', 1, 10, 11, attribution('abinadom-son-of-chemish', 'record-author'), 'Abinadom identifies himself in Omni 1:10.'),
  verses('the-book-of-omni', 1, 12, 30, attribution('amaleki-son-of-abinadom', 'record-author'), 'Amaleki identifies himself in Omni 1:12.'),
  verses('the-book-of-mormon', 8, 1, Number.MAX_SAFE_INTEGER, attribution('moroni-son-of-mormon', 'record-author'), 'Moroni begins his continuation in Mormon 8.'),
  verses('the-book-of-mormon', 9, 1, Number.MAX_SAFE_INTEGER, attribution('moroni-son-of-mormon', 'record-author'), 'Moroni continues the record in Mormon 9.'),

  // Isaiah is deliberately the primary source in exact quoted runs.
  wholeChapter('the-first-book-of-nephi', 20, attribution('isaiah', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 48.', 300),
  wholeChapter('the-first-book-of-nephi', 21, attribution('isaiah', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 49.', 300),
  wholeChapter('the-second-book-of-nephi', 7, attribution('isaiah', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 50.', 300),
  wholeChapter('the-second-book-of-nephi', 8, attribution('isaiah', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 51–52.', 300),
  ...Array.from({ length: 13 }, (_, index) => wholeChapter('the-second-book-of-nephi', index + 12, attribution('isaiah', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'), `Chapter heading identifies a comparison with Isaiah ${index + 2}.`, 300)),
  {
    id: 'the-first-book-of-nephi:19:10:neum',
    target: { kind: 'scripture', bookId: 'the-first-book-of-nephi', chapterNumber: 19, start: { unit: 10, offset: 328 }, end: { unit: 10, offset: 379 } },
    attribution: attribution('neum', 'quoted-source', 'nephi-son-of-lehi', 'quoted-by'),
    priority: 300,
    evidence: 'The exact Neum citation embedded in 1 Nephi 19:10.',
  },

  // Mosiah first wave: named sermons and records, with Isaiah overriding Abinadi.
  verses('the-book-of-mosiah', 2, 9, Number.MAX_SAFE_INTEGER, attribution('king-benjamin', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'King Benjamin begins his address in Mosiah 2:9.'),
  wholeChapter('the-book-of-mosiah', 3, attribution('king-benjamin', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'King Benjamin’s continuing address.'),
  wholeChapter('the-book-of-mosiah', 4, attribution('king-benjamin', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'King Benjamin’s continuing address.'),
  verses('the-book-of-mosiah', 5, 1, 15, attribution('king-benjamin', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'King Benjamin’s closing address.'),
  wholeChapter('the-book-of-mosiah', 9, attribution('zeniff', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Zeniff’s record begins in Mosiah 9.'),
  wholeChapter('the-book-of-mosiah', 10, attribution('zeniff', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Zeniff’s record continues in Mosiah 10.'),
  verses('the-book-of-mosiah', 11, 20, 29, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi prophesies before Noah.'),
  wholeChapter('the-book-of-mosiah', 12, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi’s testimony before Noah and priests.'),
  verses('the-book-of-mosiah', 13, 2, Number.MAX_SAFE_INTEGER, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi’s continuing testimony.'),
  wholeChapter('the-book-of-mosiah', 14, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi introduces and reads scripture.', 100),
  wholeChapter('the-book-of-mosiah', 14, attribution('isaiah', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 53.', 300),
  wholeChapter('the-book-of-mosiah', 15, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi’s continuing testimony.'),
  wholeChapter('the-book-of-mosiah', 16, attribution('abinadi', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Abinadi’s closing testimony.'),
  verses('the-book-of-mosiah', 13, 12, 24, attribution('moses', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Abinadi reads the commandments given through Moses.', 300),
  verses('the-book-of-mosiah', 18, 8, 10, attribution('alma-the-elder', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma teaches at the waters of Mormon.'),

  // Alma first wave: extended sermons and clearly delimited quoted prophets.
  verses('the-book-of-alma', 5, 3, Number.MAX_SAFE_INTEGER, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s sermon to Zarahemla.'),
  wholeChapter('the-book-of-alma', 7, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s sermon in Gideon.'),
  verses('the-book-of-alma', 9, 7, 34, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s words in Ammonihah.'),
  verses('the-book-of-alma', 11, 26, 26, attribution('zeezrom', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Zeezrom questions Amulek.'),
  verses('the-book-of-alma', 12, 3, Number.MAX_SAFE_INTEGER, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s teaching to Zeezrom.'),
  wholeChapter('the-book-of-alma', 13, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s continuing teaching.'),
  wholeChapter('the-book-of-alma', 29, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s expression of missionary desire.'),
  verses('the-book-of-alma', 30, 13, 16, attribution('korihor', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Korihor states his anti-Christ teaching.'),
  verses('the-book-of-alma', 32, 8, Number.MAX_SAFE_INTEGER, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s discourse on faith.'),
  verses('the-book-of-alma', 33, 4, 11, attribution('zenos', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Alma identifies this prayer as words of Zenos.', 300),
  verses('the-book-of-alma', 33, 16, 16, attribution('zenock', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Alma identifies this statement as words of Zenock.', 300),
  verses('the-book-of-alma', 34, 2, Number.MAX_SAFE_INTEGER, attribution('amulek', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Amulek begins teaching in Alma 34:1.'),
  wholeChapter('the-book-of-alma', 36, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s counsel to Helaman.'),
  wholeChapter('the-book-of-alma', 37, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s continuing counsel to Helaman.'),
  wholeChapter('the-book-of-alma', 38, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s counsel to Shiblon.'),
  wholeChapter('the-book-of-alma', 39, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s counsel to Corianton.'),
  wholeChapter('the-book-of-alma', 40, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s teaching on the resurrection.'),
  wholeChapter('the-book-of-alma', 41, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s teaching on restoration.'),
  wholeChapter('the-book-of-alma', 42, attribution('alma-the-younger', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Alma’s teaching on mercy and justice.'),
  verses('the-book-of-alma', 18, 16, 17, attribution('ammon-son-of-mosiah', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Ammon begins teaching King Lamoni.'),
  verses('the-book-of-alma', 22, 8, 8, attribution('aaron-son-of-mosiah', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Aaron testifies to Lamoni’s father that there is a God.'),
  verses('the-book-of-alma', 22, 10, 10, attribution('aaron-son-of-mosiah', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Aaron identifies the Great Spirit and testifies of creation.'),
  verses('the-book-of-alma', 54, 5, 14, attribution('captain-moroni', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Captain Moroni’s letter to Ammoron.'),
  verses('the-book-of-alma', 54, 16, 24, attribution('ammoron', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Ammoron’s reply to Captain Moroni.'),
  verses('the-book-of-alma', 56, 2, Number.MAX_SAFE_INTEGER, attribution('helaman-son-of-alma', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Helaman’s epistle to Captain Moroni begins.'),
  verses('the-book-of-alma', 57, 1, Number.MAX_SAFE_INTEGER, attribution('helaman-son-of-alma', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Helaman’s epistle continues.'),
  wholeChapter('the-book-of-alma', 58, attribution('helaman-son-of-alma', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Helaman’s epistle continues.'),
  verses('the-book-of-alma', 60, 1, Number.MAX_SAFE_INTEGER, attribution('captain-moroni', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Captain Moroni’s epistle to Pahoran.'),
  verses('the-book-of-alma', 61, 2, Number.MAX_SAFE_INTEGER, attribution('pahoran', 'record-author', 'mormon-son-of-mormon', 'recorded-by'), 'Pahoran’s epistle to Captain Moroni.'),

  // Third Nephi first wave: the Lord’s ministry, Samuel, and explicit biblical quotations.
  verses('third-nephi-the-book-of-nephi', 9, 1, 22, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'The voice of Christ speaks in the darkness.'),
  verses('third-nephi-the-book-of-nephi', 10, 4, 7, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'The voice of Christ continues.'),
  verses('third-nephi-the-book-of-nephi', 11, 10, 41, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Christ’s words after appearing to the people.'),
  wholeChapter('third-nephi-the-book-of-nephi', 12, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus delivers a discourse to the Nephites.'),
  wholeChapter('third-nephi-the-book-of-nephi', 13, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus continues His discourse.'),
  verses('third-nephi-the-book-of-nephi', 14, 2, Number.MAX_SAFE_INTEGER, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus continues His discourse after its narrative introduction.'),
  verses('third-nephi-the-book-of-nephi', 15, 3, 10, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus teaches the Nephites.'),
  verses('third-nephi-the-book-of-nephi', 15, 12, Number.MAX_SAFE_INTEGER, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus continues teaching His chosen disciples.'),
  wholeChapter('third-nephi-the-book-of-nephi', 16, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus teaches the Nephites.'),
  verses('third-nephi-the-book-of-nephi', 16, 17, 20, attribution('isaiah', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Jesus explicitly quotes Isaiah.', 300),
  verses('third-nephi-the-book-of-nephi', 17, 1, 4, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus tells the people to ponder and prepare for His return.'),
  verses('third-nephi-the-book-of-nephi', 17, 6, 8, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus invites the afflicted to come to Him.'),
  verses('third-nephi-the-book-of-nephi', 17, 20, 20, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus blesses the people for their faith.'),
  verses('third-nephi-the-book-of-nephi', 17, 23, 23, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus directs the multitude to behold their little ones.'),
  verses('third-nephi-the-book-of-nephi', 18, 5, 7, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus teaches during the sacrament administration.'),
  verses('third-nephi-the-book-of-nephi', 18, 10, 12, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus continues teaching during the sacrament administration.'),
  verses('third-nephi-the-book-of-nephi', 20, 8, 8, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus explains the bread and wine.'),
  wholeChapter('third-nephi-the-book-of-nephi', 21, attribution('jesus-christ', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Jesus teaches of the gathering of Israel.'),
  wholeChapter('third-nephi-the-book-of-nephi', 22, attribution('isaiah', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Chapter heading identifies a comparison with Isaiah 54.', 300),
  wholeChapter('third-nephi-the-book-of-nephi', 24, attribution('malachi', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Chapter heading identifies a comparison with Malachi 3.', 300),
  wholeChapter('third-nephi-the-book-of-nephi', 25, attribution('malachi', 'quoted-source', 'mormon-son-of-mormon', 'quoted-by'), 'Chapter heading identifies a comparison with Malachi 4.', 300),
  verses('the-book-of-helaman', 13, 2, Number.MAX_SAFE_INTEGER, attribution('samuel-the-lamanite', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Samuel begins preaching from the wall.', 200),
  wholeChapter('the-book-of-helaman', 14, attribution('samuel-the-lamanite', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Samuel’s continuing prophecy.', 200),
  wholeChapter('the-book-of-helaman', 15, attribution('samuel-the-lamanite', 'direct-speech', 'mormon-son-of-mormon', 'recorded-by'), 'Samuel’s closing prophecy.', 200),

  // Ether’s record is Moroni’s abridgment, with the brother of Jared’s direct prayer preserved.
  verses('the-book-of-ether', 3, 2, 5, attribution('brother-of-jared', 'direct-speech', 'moroni-son-of-mormon', 'recorded-by'), 'The brother of Jared prays concerning the stones.'),

  // Introductory material is annotatable text and must always receive a source.
  introParagraphs('title-page', 0, 3, attribution('church-editorial', 'editorial'), 'Publisher and copyright material.'),
  introParagraphs('title-page-of-the-book-of-mormon', 0, 1, attribution('moroni-son-of-mormon', 'translation', 'joseph-smith', 'translated-by'), 'The title page is part of the Book of Mormon record, translated by Joseph Smith.'),
  introParagraphs('title-page-of-the-book-of-mormon', 2, 2, attribution('joseph-smith', 'translation'), 'The paragraph explicitly credits Joseph Smith as translator.'),
  introParagraphs('introduction', 0, 8, attribution('church-editorial', 'editorial'), 'Edition introduction.'),
  {
    id: 'introduction:5:joseph-smith-quotation',
    target: { kind: 'intro', introId: 'introduction', start: { unit: 5, offset: 55 }, end: { unit: 5, offset: 261 } },
    attribution: attribution('joseph-smith', 'quoted-source', 'church-editorial', 'quoted-by'),
    priority: 300,
    evidence: 'The exact curly-quoted Joseph Smith statement in introduction paragraph 5.',
  },
  introParagraphs('testimony-of-three-witnesses', 0, 0, attribution('three-witnesses', 'collective-testimony'), 'Joint witness statement.'),
  introParagraphs('testimony-of-three-witnesses', 1, 1, attribution('oliver-cowdery', 'collective-testimony'), 'Oliver Cowdery signature.'),
  introParagraphs('testimony-of-three-witnesses', 2, 2, attribution('david-whitmer', 'collective-testimony'), 'David Whitmer signature.'),
  introParagraphs('testimony-of-three-witnesses', 3, 3, attribution('martin-harris', 'collective-testimony'), 'Martin Harris signature.'),
  introParagraphs('testimony-of-eight-witnesses', 0, 0, attribution('eight-witnesses', 'collective-testimony'), 'Joint witness statement.'),
  ...[
    'christian-whitmer', 'jacob-whitmer', 'peter-whitmer-jr', 'john-whitmer', 'hiram-page', 'joseph-smith-sr', 'hyrum-smith', 'samuel-h-smith',
  ].map((profileId, index) => introParagraphs('testimony-of-eight-witnesses', index + 1, index + 1, attribution(profileId, 'collective-testimony'), 'Individual witness signature.')),
  introParagraphs('testimony-of-the-prophet-joseph-smith', 0, 0, attribution('church-editorial', 'editorial'), 'Editorial introduction to Joseph Smith’s testimony.'),
  introParagraphs('testimony-of-the-prophet-joseph-smith', 1, 22, attribution('joseph-smith', 'record-author'), 'Joseph Smith’s first-person testimony.'),
  introParagraphs('testimony-of-the-prophet-joseph-smith', 23, 24, attribution('church-editorial', 'editorial'), 'Editorial closing material.'),
  introParagraphs('brief-explanation-about-the-book-of-mormon', 0, 9, attribution('church-editorial', 'editorial'), 'Edition explanatory material.'),
]

export function toStoredAttribution(input: AttributionInput): ScriptureAttribution {
  return {
    version: 1,
    ruleSetVersion: SCRIPTURE_ATTRIBUTION_RULE_SET_VERSION,
    ...input,
  }
}

export interface ScripturePersonAssociatedPassage {
  ruleId: string
  label: string
  target: ScriptureAttributionRule['target']
  evidence: string
}

function passageLabel(rule: ScriptureAttributionRule) {
  if (rule.target.kind === 'intro') return rule.target.introId ?? rule.id
  const start = rule.target.start.unit
  const end = rule.target.end.unit === Number.MAX_SAFE_INTEGER ? 'end' : rule.target.end.unit
  return `${rule.target.bookId} ${rule.target.chapterNumber}:${start}${end === start ? '' : `–${end}`}`
}

export function getAssociatedPassagesForProfile(profileId: string): ScripturePersonAssociatedPassage[] {
  const explicit = SCRIPTURE_ATTRIBUTION_RULES
    .filter((rule) => rule.attribution.primaryProfileId === profileId || rule.attribution.secondaryProfileId === profileId)
    .map((rule) => ({ ruleId: rule.id, label: passageLabel(rule), target: rule.target, evidence: rule.evidence }))
  const defaults = Object.entries(SCRIPTURE_BOOK_DEFAULTS)
    .filter(([, attribution]) => attribution.primaryProfileId === profileId)
    .map(([bookId, attribution]) => ({
      ruleId: `default:${bookId}:${profileId}`,
      label: `${bookId} (record default)`,
      target: { kind: 'scripture' as const, bookId, start: { unit: 1, offset: 0 }, end: { unit: Number.MAX_SAFE_INTEGER, offset: 'end' as const } },
      evidence: `${profileId} is the default record author for this book.`,
      attribution,
    }))
  return [...explicit, ...defaults].map(({ ruleId, label, target, evidence }) => ({ ruleId, label, target, evidence }))
}
