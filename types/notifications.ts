import type { ObjectId } from 'mongodb'

export type NotificationKind = 'comment' | 'reply' | 'annotation-like' | 'comment-like'

export type StoredNotification = {
  _id?: ObjectId
  eventKey: string
  recipientUserId: number
  actorUserId: number
  actorName: string
  kind: NotificationKind
  annotationId: string
  commentId?: string
  targetPath: string
  excerpt: string
  createdAt: Date
  readAt: Date | null
}

export type NewNotification = Omit<StoredNotification, '_id' | 'readAt'>

export type InAppNotification = Omit<StoredNotification, '_id'> & { id: string }

export type NotificationCursor = {
  createdAt: string
  id: string
}

export type NotificationPage = {
  items: InAppNotification[]
  nextCursor: NotificationCursor | null
}
