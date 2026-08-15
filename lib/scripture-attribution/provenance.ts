import portraitManifestJson from '../../public/scripture-people/provenance.json' with { type: 'json' }

export type ScripturePortraitKind = 'official' | 'generated' | 'editorial'

export interface ScripturePortraitManifestEntry {
  file: string
  kind: ScripturePortraitKind
  source?: string
  credit?: string
  officialSearch?: string
  officialCandidate?: string
  decision?: string
}

export interface ScripturePortraitManifest {
  schemaVersion: 1
  reviewedAt: string
  assetFormat: string
  readabilityReview: string
  officialUsageNotes: string
  officialPolicySources: string[]
  generationPromptVersion: string
  generationPrompt: string
  profiles: Record<string, ScripturePortraitManifestEntry>
}

/**
 * One checked-in source of truth for all portrait rights and disclosure data.
 * Kept as a static import so it works in both server profile pages and client
 * attribution bylines without a runtime public-file fetch.
 */
export const SCRIPTURE_PORTRAIT_MANIFEST = portraitManifestJson as ScripturePortraitManifest
export const SCRIPTURE_PERSON_PORTRAIT_PROVENANCE = SCRIPTURE_PORTRAIT_MANIFEST.profiles

export function getScripturePortraitProvenance(id: string): ScripturePortraitManifestEntry | undefined {
  return SCRIPTURE_PERSON_PORTRAIT_PROVENANCE[id]
}

export function isHttpUrl(value: string | undefined) {
  try {
    const url = new URL(value ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Validates portable metadata; asset existence is tested separately on disk. */
export function validateScripturePortraitManifest(profileIds: Iterable<string>): string[] {
  const failures: string[] = []
  const expectedIds = new Set(profileIds)
  const actualIds = new Set(Object.keys(SCRIPTURE_PERSON_PORTRAIT_PROVENANCE))

  for (const id of expectedIds) {
    const entry = getScripturePortraitProvenance(id)
    if (!entry) {
      failures.push(`${id}: missing portrait provenance`)
      continue
    }
    if (entry.file !== `/scripture-people/${id}.webp`) failures.push(`${id}: portrait file must use its stable ID`)
    if (!['official', 'generated', 'editorial'].includes(entry.kind)) failures.push(`${id}: invalid portrait kind`)
    if (entry.kind === 'official') {
      if (!entry.credit) failures.push(`${id}: official portrait lacks credit`)
      if (!isHttpUrl(entry.source)) failures.push(`${id}: official portrait lacks an https source URL`)
    }
    if (entry.kind === 'generated' && !(entry.officialSearch || entry.officialCandidate || entry.decision)) {
      failures.push(`${id}: generated portrait lacks an official-first decision note`)
    }
    if (entry.kind === 'editorial' && !entry.decision) failures.push(`${id}: editorial portrait lacks a disclosure decision`)
  }

  for (const id of actualIds) {
    if (!expectedIds.has(id)) failures.push(`${id}: provenance has no matching catalog profile`)
  }
  return failures
}
