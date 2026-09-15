import type { Annotation, AnnotationComment, AnnotationLike } from '../../types/scripture.ts'
import type { NewNotification } from '../../types/notifications.ts'

function annotationId(annotation: Annotation) {
  const value = annotation._id?.toString()
  if (!value) throw new Error('A saved annotation ID is required to create a notification')
  return value
}

export function buildCommentNotifications(annotation: Annotation, comment: AnnotationComment): NewNotification[] {
  const id = annotationId(annotation)
  const commentId = comment._id.toString()
  const targetPath = `/annotation/${id}?comment=${commentId}#comment-${commentId}`
  const common = {
    eventKey: `comment:${commentId}`,
    actorUserId: comment.userId,
    actorName: comment.userName,
    annotationId: id,
    commentId,
    targetPath,
    excerpt: comment.content,
    createdAt: new Date(comment.timeStamp),
  }
  const recipients = new Map<number, NewNotification>()

  if (annotation.userId !== comment.userId) {
    recipients.set(annotation.userId, { ...common, recipientUserId: annotation.userId, kind: 'comment' })
  }

  const parent = comment.parentCommentId
    ? annotation.comments.find(item => item._id.toString() === comment.parentCommentId?.toString())
    : undefined
  if (parent && parent.userId !== comment.userId) {
    recipients.set(parent.userId, { ...common, recipientUserId: parent.userId, kind: 'reply' })
  }

  return [...recipients.values()]
}

export function buildAnnotationLikeNotifications(annotation: Annotation, like: AnnotationLike): NewNotification[] {
  if (annotation.userId === like.userId) return []
  const id = annotationId(annotation)
  return [{
    eventKey: `annotation-like:${like._id.toString()}`,
    recipientUserId: annotation.userId,
    actorUserId: like.userId,
    actorName: like.userName,
    kind: 'annotation-like',
    annotationId: id,
    targetPath: `/annotation/${id}`,
    excerpt: annotation.text,
    createdAt: new Date(like.timeStamp),
  }]
}

export function buildCommentLikeNotifications(
  annotation: Annotation,
  comment: AnnotationComment,
  like: AnnotationLike,
): NewNotification[] {
  if (comment.userId === like.userId) return []
  const id = annotationId(annotation)
  const commentId = comment._id.toString()
  return [{
    eventKey: `comment-like:${like._id.toString()}`,
    recipientUserId: comment.userId,
    actorUserId: like.userId,
    actorName: like.userName,
    kind: 'comment-like',
    annotationId: id,
    commentId,
    targetPath: `/annotation/${id}?comment=${commentId}#comment-${commentId}`,
    excerpt: comment.content,
    createdAt: new Date(like.timeStamp),
  }]
}
