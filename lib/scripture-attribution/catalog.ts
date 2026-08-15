import {
  getScripturePortraitProvenance,
  SCRIPTURE_PORTRAIT_MANIFEST,
  type ScripturePortraitKind,
} from './provenance.ts'

export type ScripturePersonProfileKind = 'person' | 'collective' | 'institution'

export interface ScripturePersonProfile {
  id: string
  name: string
  kind: ScripturePersonProfileKind
  roles: string[]
  biography: string
  /** Members are used by collective profiles such as the witness statements. */
  memberIds?: string[]
  portraitPath: string
  /** A local-safe fallback when an image has not been generated or added yet. */
  portraitFallback: string
  portraitProvenance: {
    kind: ScripturePortraitKind
    credit: string
    sourceUrl?: string
    officialSearch?: string
    officialCandidate?: string
    decision?: string
    generationPrompt?: string
    reviewedAt: string
  }
}

const portrait = (id: string, fallback: string) => {
  const provenance = getScripturePortraitProvenance(id)
  if (!provenance) throw new Error(`Missing portrait provenance for ${id}`)

  const sourceUrl = provenance.kind === 'official' && provenance.source?.startsWith('https://')
    ? provenance.source
    : undefined
  const credit = provenance.kind === 'generated'
    ? 'AI-generated artistic depiction'
    : provenance.credit ?? (provenance.kind === 'editorial' ? 'Family Plates editorial asset' : 'Official artwork')

  return {
  portraitPath: provenance.file,
  portraitFallback: fallback,
  portraitProvenance: {
    kind: provenance.kind,
    credit,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(provenance.officialSearch ? { officialSearch: provenance.officialSearch } : {}),
    ...(provenance.officialCandidate ? { officialCandidate: provenance.officialCandidate } : {}),
    ...(provenance.decision ? { decision: provenance.decision } : {}),
    ...(provenance.kind === 'generated' ? { generationPrompt: SCRIPTURE_PORTRAIT_MANIFEST.generationPrompt } : {}),
    reviewedAt: SCRIPTURE_PORTRAIT_MANIFEST.reviewedAt,
  },
  }
}

/**
 * Stable source profiles.  Individual images may be replaced without changing
 * IDs embedded in saved annotations.
 */
export const SCRIPTURE_PERSON_PROFILES: ScripturePersonProfile[] = [
  { id: 'nephi-son-of-lehi', name: 'Nephi', kind: 'person', roles: ['Prophet', 'Record keeper'], biography: 'Son of Lehi and author of the first and second books of Nephi.', ...portrait('nephi-son-of-lehi', 'N') },
  { id: 'lehi', name: 'Lehi', kind: 'person', roles: ['Prophet', 'Patriarch'], biography: 'Prophet who led his family from Jerusalem to the promised land.', ...portrait('lehi', 'L') },
  { id: 'jacob-brother-of-nephi', name: 'Jacob', kind: 'person', roles: ['Prophet', 'Record keeper'], biography: 'Brother of Nephi and author of the book of Jacob.', ...portrait('jacob-brother-of-nephi', 'J') },
  { id: 'enos-son-of-jacob', name: 'Enos', kind: 'person', roles: ['Prophet', 'Record keeper'], biography: 'Son of Jacob and author of the book of Enos.', ...portrait('enos-son-of-jacob', 'E') },
  { id: 'jarom-son-of-enos', name: 'Jarom', kind: 'person', roles: ['Record keeper'], biography: 'Son of Enos and author of the book of Jarom.', ...portrait('jarom-son-of-enos', 'J') },
  { id: 'omni-son-of-jarom', name: 'Omni', kind: 'person', roles: ['Record keeper'], biography: 'Son of Jarom and the first writer in the book of Omni.', ...portrait('omni-son-of-jarom', 'O') },
  { id: 'amaron-son-of-omni', name: 'Amaron', kind: 'person', roles: ['Record keeper'], biography: 'Son of Omni and a writer in the book of Omni.', ...portrait('amaron-son-of-omni', 'A') },
  { id: 'chemish-brother-of-amaron', name: 'Chemish', kind: 'person', roles: ['Record keeper'], biography: 'Brother of Amaron and a writer in the book of Omni.', ...portrait('chemish-brother-of-amaron', 'C') },
  { id: 'abinadom-son-of-chemish', name: 'Abinadom', kind: 'person', roles: ['Record keeper'], biography: 'Son of Chemish and a writer in the book of Omni.', ...portrait('abinadom-son-of-chemish', 'A') },
  { id: 'amaleki-son-of-abinadom', name: 'Amaleki', kind: 'person', roles: ['Record keeper'], biography: 'Son of Abinadom and the final writer on the small plates of Nephi.', ...portrait('amaleki-son-of-abinadom', 'A') },
  { id: 'mormon-son-of-mormon', name: 'Mormon', kind: 'person', roles: ['Prophet-historian', 'Abridger'], biography: 'Nephite prophet-historian who abridged much of the record.', ...portrait('mormon-son-of-mormon', 'M') },
  { id: 'moroni-son-of-mormon', name: 'Moroni', kind: 'person', roles: ['Prophet', 'Abridger', 'Record keeper'], biography: 'Son of Mormon who completed the record and abridged Ether.', ...portrait('moroni-son-of-mormon', 'M') },
  { id: 'nephi-son-of-nephi', name: 'Nephi', kind: 'person', roles: ['Disciple of Jesus Christ', 'Record keeper'], biography: 'Son of Nephi and a disciple of Jesus Christ; associated with Fourth Nephi.', ...portrait('nephi-son-of-nephi', 'N') },
  { id: 'king-benjamin', name: 'King Benjamin', kind: 'person', roles: ['King', 'Prophet'], biography: 'Nephite king whose address is preserved in Mosiah.', ...portrait('king-benjamin', 'B') },
  { id: 'zeniff', name: 'Zeniff', kind: 'person', roles: ['Record keeper'], biography: 'Leader whose first-person record appears in Mosiah 9–10.', ...portrait('zeniff', 'Z') },
  { id: 'abinadi', name: 'Abinadi', kind: 'person', roles: ['Prophet'], biography: 'Prophet who testified before King Noah and his priests.', ...portrait('abinadi', 'A') },
  { id: 'alma-the-elder', name: 'Alma the Elder', kind: 'person', roles: ['Prophet', 'High priest'], biography: 'Founder of the Church among the Nephites after believing Abinadi.', ...portrait('alma-the-elder', 'A') },
  { id: 'alma-the-younger', name: 'Alma the Younger', kind: 'person', roles: ['Chief judge', 'High priest', 'Prophet'], biography: 'Son of Alma the Elder and a principal teacher in the book of Alma.', ...portrait('alma-the-younger', 'A') },
  { id: 'amulek', name: 'Amulek', kind: 'person', roles: ['Missionary', 'Teacher'], biography: 'Companion of Alma in Ammonihah and teacher of the Atonement.', ...portrait('amulek', 'A') },
  { id: 'ammon-son-of-mosiah', name: 'Ammon', kind: 'person', roles: ['Missionary'], biography: 'Son of King Mosiah and missionary among the Lamanites.', ...portrait('ammon-son-of-mosiah', 'A') },
  { id: 'aaron-son-of-mosiah', name: 'Aaron', kind: 'person', roles: ['Missionary'], biography: 'Son of King Mosiah and missionary companion to his brothers.', ...portrait('aaron-son-of-mosiah', 'A') },
  { id: 'helaman-son-of-alma', name: 'Helaman', kind: 'person', roles: ['Military leader', 'Record keeper'], biography: 'Son of Alma the Younger and leader of the stripling warriors.', ...portrait('helaman-son-of-alma', 'H') },
  { id: 'captain-moroni', name: 'Moroni', kind: 'person', roles: ['Captain', 'Chief commander'], biography: 'Nephite commander; distinct from Moroni, son of Mormon.', ...portrait('captain-moroni', 'M') },
  { id: 'pahoran', name: 'Pahoran', kind: 'person', roles: ['Chief judge'], biography: 'Nephite chief judge who exchanged letters with Captain Moroni.', ...portrait('pahoran', 'P') },
  { id: 'ammoron', name: 'Ammoron', kind: 'person', roles: ['Lamanite king'], biography: 'Lamanite king who exchanged letters with Captain Moroni.', ...portrait('ammoron', 'A') },
  { id: 'korihor', name: 'Korihor', kind: 'person', roles: ['Anti-Christ'], biography: 'Teacher whose words and confrontation with Alma are recorded in Alma 30.', ...portrait('korihor', 'K') },
  { id: 'zeezrom', name: 'Zeezrom', kind: 'person', roles: ['Lawyer'], biography: 'Lawyer in Ammonihah who questioned Alma and Amulek and later repented.', ...portrait('zeezrom', 'Z') },
  { id: 'jesus-christ', name: 'Jesus Christ', kind: 'person', roles: ['Son of God', 'Teacher'], biography: 'The resurrected Lord who ministered among the Nephites.', ...portrait('jesus-christ', 'J') },
  { id: 'samuel-the-lamanite', name: 'Samuel the Lamanite', kind: 'person', roles: ['Prophet'], biography: 'Lamanite prophet who preached from the wall of Zarahemla.', ...portrait('samuel-the-lamanite', 'S') },
  { id: 'isaiah', name: 'Isaiah', kind: 'person', roles: ['Hebrew prophet', 'Quoted source'], biography: 'Biblical prophet whose writings are quoted throughout the Book of Mormon.', ...portrait('isaiah', 'I') },
  { id: 'malachi', name: 'Malachi', kind: 'person', roles: ['Hebrew prophet', 'Quoted source'], biography: 'Biblical prophet whose writings are quoted in Third Nephi.', ...portrait('malachi', 'M') },
  { id: 'zenos', name: 'Zenos', kind: 'person', roles: ['Prophet', 'Quoted source'], biography: 'Ancient prophet cited by Book of Mormon teachers.', ...portrait('zenos', 'Z') },
  { id: 'zenock', name: 'Zenock', kind: 'person', roles: ['Prophet', 'Quoted source'], biography: 'Ancient prophet cited by Alma concerning the Son of God.', ...portrait('zenock', 'Z') },
  { id: 'neum', name: 'Neum', kind: 'person', roles: ['Prophet', 'Quoted source'], biography: 'Ancient prophet mentioned by Nephi among witnesses of the Messiah.', ...portrait('neum', 'N') },
  { id: 'moses', name: 'Moses', kind: 'person', roles: ['Prophet', 'Quoted source'], biography: 'Ancient prophet whose teachings and symbolic acts are cited in the record.', ...portrait('moses', 'M') },
  { id: 'brother-of-jared', name: 'Brother of Jared', kind: 'person', roles: ['Prophet', 'Jaredite leader'], biography: 'Jaredite prophet whose account is abridged in the book of Ether.', ...portrait('brother-of-jared', 'BJ') },
  { id: 'joseph-smith', name: 'Joseph Smith', kind: 'person', roles: ['Translator', 'Prophet'], biography: 'Translator of the Book of Mormon and author of the included testimony.', ...portrait('joseph-smith', 'J') },
  { id: 'oliver-cowdery', name: 'Oliver Cowdery', kind: 'person', roles: ['Three Witnesses'], biography: 'One of the Three Witnesses to the Book of Mormon plates.', ...portrait('oliver-cowdery', 'O') },
  { id: 'david-whitmer', name: 'David Whitmer', kind: 'person', roles: ['Three Witnesses'], biography: 'One of the Three Witnesses to the Book of Mormon plates.', ...portrait('david-whitmer', 'D') },
  { id: 'martin-harris', name: 'Martin Harris', kind: 'person', roles: ['Three Witnesses'], biography: 'One of the Three Witnesses to the Book of Mormon plates.', ...portrait('martin-harris', 'M') },
  { id: 'christian-whitmer', name: 'Christian Whitmer', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('christian-whitmer', 'C') },
  { id: 'jacob-whitmer', name: 'Jacob Whitmer', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('jacob-whitmer', 'J') },
  { id: 'peter-whitmer-jr', name: 'Peter Whitmer Jr.', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('peter-whitmer-jr', 'P') },
  { id: 'john-whitmer', name: 'John Whitmer', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('john-whitmer', 'J') },
  { id: 'hiram-page', name: 'Hiram Page', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('hiram-page', 'H') },
  { id: 'joseph-smith-sr', name: 'Joseph Smith Sr.', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('joseph-smith-sr', 'J') },
  { id: 'hyrum-smith', name: 'Hyrum Smith', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('hyrum-smith', 'H') },
  { id: 'samuel-h-smith', name: 'Samuel H. Smith', kind: 'person', roles: ['Eight Witnesses'], biography: 'One of the Eight Witnesses to the Book of Mormon plates.', ...portrait('samuel-h-smith', 'S') },
  { id: 'three-witnesses', name: 'The Three Witnesses', kind: 'collective', roles: ['Collective testimony'], biography: 'Oliver Cowdery, David Whitmer, and Martin Harris gave this joint testimony.', memberIds: ['oliver-cowdery', 'david-whitmer', 'martin-harris'], ...portrait('three-witnesses', '3') },
  { id: 'eight-witnesses', name: 'The Eight Witnesses', kind: 'collective', roles: ['Collective testimony'], biography: 'Eight named witnesses gave this joint testimony.', memberIds: ['christian-whitmer', 'jacob-whitmer', 'peter-whitmer-jr', 'john-whitmer', 'hiram-page', 'joseph-smith-sr', 'hyrum-smith', 'samuel-h-smith'], ...portrait('eight-witnesses', '8') },
  { id: 'church-editorial', name: 'Church Editorial', kind: 'institution', roles: ['Editorial material'], biography: 'Editorial and publishing material included with this edition of the Book of Mormon.', ...portrait('church-editorial', 'CE') },
]

const profileMap = new Map(SCRIPTURE_PERSON_PROFILES.map((profile) => [profile.id, profile]))

export function getScripturePersonProfile(id: string | null | undefined): ScripturePersonProfile | undefined {
  return id ? profileMap.get(id) : undefined
}

export function getScripturePersonProfileOrNull(id: string | null | undefined): ScripturePersonProfile | null {
  return getScripturePersonProfile(id) ?? null
}
