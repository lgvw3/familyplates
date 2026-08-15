import type { ScriptureAttribution } from '../../types/scripture.ts'

export function sameScriptureAttribution(a: ScriptureAttribution | null | undefined, b: ScriptureAttribution | null | undefined) {
  return a?.version === b?.version
    && a?.ruleSetVersion === b?.ruleSetVersion
    && a?.primaryProfileId === b?.primaryProfileId
    && a?.secondaryProfileId === b?.secondaryProfileId
    && a?.relation === b?.relation
    && a?.basis === b?.basis
}

export function shouldBackfillScriptureAttribution(existing: ScriptureAttribution | null | undefined, resolved: ScriptureAttribution) {
  return !sameScriptureAttribution(existing, resolved)
}
