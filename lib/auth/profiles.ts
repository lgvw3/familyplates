import 'server-only'

import type { Annotation } from '@/types/scripture'
import clientPromise from '@/lib/mongodb'
import { accounts } from './accounts'
import type { FamilyInteraction, UserAccount } from './definitions'

type StoredUserProfile = {
  userId: number
  avatar?: string
  updatedAt: Date
}

export async function fetchFamilyAccounts(): Promise<UserAccount[]> {
  try {
    const client = await clientPromise
    const profiles = await client.db('main').collection<StoredUserProfile>('userProfiles')
      .find({ userId: { $in: accounts.map(account => account.id) } })
      .toArray()
    const profileMap = new Map(profiles.map(profile => [profile.userId, profile]))

    return accounts.map(account => ({
      ...account,
      avatar: profileMap.get(account.id)?.avatar,
    }))
  } catch (error) {
    console.error('Error fetching family profiles:', error)
    return accounts
  }
}

export async function fetchFamilyAccount(userId: number): Promise<UserAccount | undefined> {
  const account = accounts.find(candidate => candidate.id === userId)
  if (!account) return undefined

  try {
    const client = await clientPromise
    const profile = await client.db('main').collection<StoredUserProfile>('userProfiles').findOne({ userId })
    return { ...account, avatar: profile?.avatar }
  } catch (error) {
    console.error('Error fetching family profile:', error)
    return account
  }
}

export async function fetchFamilyInteractions(userId: number, limit = 25): Promise<FamilyInteraction[]> {
  const normalizedLimit = Math.max(1, Math.min(Math.floor(limit), 100))
  try {
    const client = await clientPromise
    const annotations = await client.db('main').collection<Annotation>('annotations').find({
      $or: [
        { 'comments.userId': userId },
        { 'likes.userId': userId },
        { 'comments.likes.userId': userId },
      ],
    }).toArray()

    const interactions: FamilyInteraction[] = []
    for (const annotation of annotations) {
      const annotationId = annotation._id?.toString()
      if (!annotationId) continue
      const common = {
        annotationId,
        annotationAuthorName: annotation.userName,
        annotationText: annotation.text,
      }

      for (const comment of annotation.comments ?? []) {
        const commentId = comment._id.toString()
        if (comment.userId === userId) {
          interactions.push({
            ...common,
            key: `comment:${commentId}`,
            kind: 'comment',
            occurredAt: new Date(comment.timeStamp),
            commentId,
            commentAuthorName: comment.userName,
            commentContent: comment.content,
          })
        }
        for (const like of comment.likes ?? []) {
          if (like.userId !== userId) continue
          interactions.push({
            ...common,
            key: `comment-like:${like._id.toString()}`,
            kind: 'comment-like',
            occurredAt: new Date(like.timeStamp),
            commentId,
            commentAuthorName: comment.userName,
            commentContent: comment.content,
          })
        }
      }

      for (const like of annotation.likes ?? []) {
        if (like.userId !== userId) continue
        interactions.push({
          ...common,
          key: `annotation-like:${like._id.toString()}`,
          kind: 'annotation-like',
          occurredAt: new Date(like.timeStamp),
        })
      }
    }

    return interactions
      .filter(interaction => !Number.isNaN(interaction.occurredAt.getTime()))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, normalizedLimit)
  } catch (error) {
    console.error('Error fetching family interactions:', error)
    return []
  }
}
