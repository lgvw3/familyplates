'use server'

import type { AnnotationTarget, ScriptureAttribution } from '@/types/scripture'
import { InvalidAttributionTargetError, resolveScriptureAttribution } from './resolver'

/**
 * Attribution is preview data only here. The save action resolves it again
 * from the checked-in source before persisting the annotation.
 */
export async function previewScriptureAttribution(
  target: AnnotationTarget,
): Promise<ScriptureAttribution | null> {
  try {
    return resolveScriptureAttribution(target)
  } catch (error) {
    if (!(error instanceof InvalidAttributionTargetError)) console.error(error)
    return null
  }
}
