import { Annotation, AnnotationTarget } from '@/types/scripture'
import { toTitleCase } from '@/lib/utils'

export function getAnnotationQuote(annotation: Annotation) {
  return annotation.target?.quote.exact ?? ''
}

export function getTargetReference(target: AnnotationTarget) {
  if (target.kind === 'intro') return toTitleCase(target.introId.replaceAll('-', ' '))

  const firstVerse = target.start.unit
  const lastVerse = target.end.unit
  const verses = firstVerse === lastVerse ? `${firstVerse}` : `${firstVerse}-${lastVerse}`
  return `${toTitleCase(target.bookId.replaceAll('-', ' '))} ${target.chapterNumber}:${verses}`
}

export function getAnnotationReference(annotation: Annotation) {
  return annotation.target ? getTargetReference(annotation.target) : null
}

export function getTargetHref(target: AnnotationTarget) {
  if (target.kind === 'intro') {
    return `/intro/${encodeURIComponent(target.introId)}`
  }

  return `/book/${encodeURIComponent(target.bookId)}/chapter/chapter_${target.chapterNumber}/#verse-${target.start.unit}`
}

export function getAnnotationTargetKey(annotation: Annotation) {
  const target = annotation.target
  if (!target) return null
  return target.kind === 'scripture'
    ? `scripture:${target.bookId}:${target.chapterNumber}`
    : `intro:${target.introId}`
}
