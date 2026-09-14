import type { Annotation } from '@/types/scripture'

export const annotationUpdatesChannel = 'annotationUpdates' as const

export type AnnotationUpdateEvent = {
  annotationId: string
  target: Annotation['target']
}

export function serializeAnnotationUpdate(event: AnnotationUpdateEvent) {
  return JSON.stringify(event)
}

export function parseAnnotationUpdate(value: string): AnnotationUpdateEvent | null {
  try {
    const event = JSON.parse(value) as Partial<AnnotationUpdateEvent>
    if (typeof event.annotationId !== 'string' || !event.annotationId) return null
    return {
      annotationId: event.annotationId,
      target: event.target ?? null,
    }
  } catch {
    return null
  }
}

export function annotationTargetKey(target: Annotation['target']) {
  if (!target) return null
  return target.kind === 'scripture'
    ? `scripture:${target.bookId}:${target.chapterNumber}`
    : `intro:${target.introId}`
}
