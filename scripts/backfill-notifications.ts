import clientPromise, { getMongoDatabase, mongoClient, mongoDatabaseName } from '../lib/mongodb.ts'
import {
  buildAnnotationLikeNotifications,
  buildCommentLikeNotifications,
  buildCommentNotifications,
} from '../lib/notifications/builders.ts'
import type { Annotation } from '../types/scripture.ts'
import type { NewNotification, StoredNotification } from '../types/notifications.ts'

const apply = process.argv.includes('--apply')
const cutoffValue = process.argv.find(argument => argument.startsWith('--cutoff='))?.slice('--cutoff='.length)
if (!cutoffValue) throw new Error('--cutoff=<ISO timestamp> is required')
const cutoff = new Date(cutoffValue)
if (Number.isNaN(cutoff.getTime())) throw new Error('--cutoff must be a valid timestamp')
const client = await clientPromise

try {
  const database = getMongoDatabase(client)
  const annotations = database.collection<Annotation>('annotations')
  const notifications = database.collection<StoredNotification>('notifications')
  const records = new Map<string, NewNotification>()
  const byKind = new Map<string, number>()

  for await (const annotation of annotations.find({})) {
    for (const comment of annotation.comments ?? []) {
      const built = [
        ...buildCommentNotifications(annotation, comment),
        ...(comment.likes ?? []).flatMap(like => buildCommentLikeNotifications(annotation, comment, like)),
      ]
      for (const notification of built) {
        records.set(`${notification.recipientUserId}:${notification.eventKey}`, notification)
      }
    }
    for (const like of annotation.likes ?? []) {
      for (const notification of buildAnnotationLikeNotifications(annotation, like)) {
        records.set(`${notification.recipientUserId}:${notification.eventKey}`, notification)
      }
    }
  }

  for (const notification of records.values()) {
    byKind.set(notification.kind, (byKind.get(notification.kind) ?? 0) + 1)
  }
  console.log({
    mode: apply ? 'apply' : 'dry-run',
    database: mongoDatabaseName,
    cutoff: cutoff.toISOString(),
    notifications: records.size,
    byKind: Object.fromEntries(byKind),
  })

  if (apply) {
    await Promise.all([
      notifications.createIndex({ recipientUserId: 1, eventKey: 1 }, { unique: true, name: 'recipient_event' }),
      notifications.createIndex({ recipientUserId: 1, readAt: 1 }, { name: 'recipient_unread' }),
      notifications.createIndex({ recipientUserId: 1, createdAt: -1, _id: -1 }, { name: 'recipient_recent' }),
    ])
    if (records.size) {
      const result = await notifications.bulkWrite([...records.values()].map(notification => ({
        updateOne: {
          filter: { recipientUserId: notification.recipientUserId, eventKey: notification.eventKey },
          update: {
            $setOnInsert: {
              ...notification,
              readAt: notification.createdAt <= cutoff ? cutoff : null,
            },
          },
          upsert: true,
        },
      })), { ordered: false })
      console.log({ inserted: result.upsertedCount, preservedExisting: records.size - result.upsertedCount })
    }
  }
} finally {
  await mongoClient.close()
}
