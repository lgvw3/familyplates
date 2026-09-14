import type { Annotation, AnnotationLike } from '../../types/scripture.ts'

function likeId(like: AnnotationLike | undefined) {
  return like?._id.toString()
}

export function findUserLike(likes: AnnotationLike[], userId: number) {
  return likes.find(like => like.userId === userId)
}

function replaceUserLike(likes: AnnotationLike[], userId: number, replacement?: AnnotationLike) {
  const current = findUserLike(likes, userId)
  if (likeId(current) === likeId(replacement)) return likes
  const withoutUser = likes.filter(like => like.userId !== userId)
  return replacement ? [...withoutUser, replacement] : withoutUser
}

export function replaceAnnotationUserLike(
  annotation: Annotation,
  userId: number,
  replacement?: AnnotationLike,
) {
  const likes = replaceUserLike(annotation.likes, userId, replacement)
  return likes === annotation.likes ? annotation : { ...annotation, likes }
}

export function replaceCommentUserLike(
  annotation: Annotation,
  commentId: string,
  userId: number,
  replacement?: AnnotationLike,
) {
  let changed = false
  const comments = annotation.comments.map(comment => {
    if (comment._id.toString() !== commentId) return comment
    const likes = replaceUserLike(comment.likes ?? [], userId, replacement)
    if (likes === comment.likes) return comment
    changed = true
    return { ...comment, likes }
  })
  return changed ? { ...annotation, comments } : annotation
}

export function annotationHasLike(annotation: Annotation, userId: number, expectedId?: string) {
  const like = findUserLike(annotation.likes, userId)
  return expectedId === undefined ? like === undefined : likeId(like) === expectedId
}

export function commentHasLike(
  annotation: Annotation,
  commentId: string,
  userId: number,
  expectedId?: string,
) {
  const comment = annotation.comments.find(item => item._id.toString() === commentId)
  const like = comment && findUserLike(comment.likes ?? [], userId)
  return expectedId === undefined ? like === undefined : likeId(like) === expectedId
}
