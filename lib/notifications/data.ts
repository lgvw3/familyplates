'use server'

import { ObjectId } from 'mongodb'
import { after } from 'next/server'
import { requireCurrentFamilyMember } from '@/lib/auth/current-user'
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { markNotificationsReadThrough, notificationCollection } from './store'
import type { InAppNotification, NotificationCursor, NotificationPage, StoredNotification } from '@/types/notifications'
import type { UserAccount } from '@/lib/auth/definitions'

function serializeNotification(notification: StoredNotification & { _id: ObjectId }): InAppNotification {
  const { _id, ...rest } = notification
  return { ...rest, id: _id.toString() }
}

async function fetchNotificationPageForRecipient({
  recipientUserId,
  limit = 20,
  cursor,
}: {
  recipientUserId: number
  limit?: number
  cursor?: NotificationCursor | null
}): Promise<NotificationPage> {
  const normalizedLimit = Math.max(1, Math.min(Math.floor(limit), 50))
  const collection = await notificationCollection()
  let cursorFilter = {}
  if (cursor) {
    const createdAt = new Date(cursor.createdAt)
    if (Number.isNaN(createdAt.getTime()) || !ObjectId.isValid(cursor.id)) throw new Error('Invalid notification cursor')
    const id = new ObjectId(cursor.id)
    cursorFilter = { $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: id } }] }
  }
  const records = await collection.find({ recipientUserId, ...cursorFilter })
    .sort({ createdAt: -1, _id: -1 })
    .limit(normalizedLimit + 1)
    .toArray()
  const hasMore = records.length > normalizedLimit
  const pageRecords = records.slice(0, normalizedLimit)
  const last = pageRecords.at(-1)
  return {
    items: pageRecords.map(serializeNotification),
    nextCursor: hasMore && last ? { createdAt: last.createdAt.toISOString(), id: last._id.toString() } : null,
  }
}

export async function fetchNotificationPage({
  limit = 20,
  cursor,
}: {
  limit?: number
  cursor?: NotificationCursor | null
} = {}): Promise<NotificationPage> {
  const { id: recipientUserId } = await requireCurrentFamilyMember()
  return fetchNotificationPageForRecipient({ recipientUserId, limit, cursor })
}

export type NotificationCenterContext = {
  openedAt: string
  users: UserAccount[]
}

export async function openNotificationCenter(): Promise<NotificationCenterContext> {
  const { id: recipientUserId } = await requireCurrentFamilyMember()
  const openedAt = new Date()
  const users = await fetchFamilyAccounts()

  after(async () => {
    try {
      await markNotificationsReadThrough(recipientUserId, openedAt)
    } catch (error) {
      console.error('Could not mark notifications as read:', error)
    }
  })

  return { openedAt: openedAt.toISOString(), users }
}

export async function fetchUnreadNotificationCount() {
  const { id: recipientUserId } = await requireCurrentFamilyMember()
  const collection = await notificationCollection()
  return collection.countDocuments({ recipientUserId, readAt: null }, { limit: 10 })
}
