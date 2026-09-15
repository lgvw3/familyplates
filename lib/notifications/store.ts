import 'server-only'

import type { Collection } from 'mongodb'
import clientPromise, { getMongoDatabase } from '@/lib/mongodb'
import type { NewNotification, StoredNotification } from '@/types/notifications'

let indexesPromise: Promise<unknown> | null = null

export async function notificationCollection(): Promise<Collection<StoredNotification>> {
  const client = await clientPromise
  const collection = getMongoDatabase(client).collection<StoredNotification>('notifications')
  indexesPromise ??= Promise.all([
    collection.createIndex({ recipientUserId: 1, eventKey: 1 }, { unique: true, name: 'recipient_event' }),
    collection.createIndex({ recipientUserId: 1, readAt: 1 }, { name: 'recipient_unread' }),
    collection.createIndex({ recipientUserId: 1, createdAt: -1, _id: -1 }, { name: 'recipient_recent' }),
  ])
  try {
    await indexesPromise
  } catch (error) {
    indexesPromise = null
    throw error
  }
  return collection
}

export async function recordNotifications(notifications: NewNotification[]) {
  if (!notifications.length) return
  const collection = await notificationCollection()
  await collection.bulkWrite(notifications.map(notification => ({
    updateOne: {
      filter: { recipientUserId: notification.recipientUserId, eventKey: notification.eventKey },
      update: { $setOnInsert: { ...notification, readAt: null } },
      upsert: true,
    },
  })), { ordered: false })
}

export async function markNotificationsReadThrough(recipientUserId: number, cutoff: Date) {
  const collection = await notificationCollection()
  await collection.updateMany(
    {
      recipientUserId,
      readAt: null,
      createdAt: { $lte: cutoff },
    },
    { $set: { readAt: cutoff } },
  )
}
