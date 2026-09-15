import 'server-only'

import type { Annotation } from '@/types/scripture'
import clientPromise from '@/lib/mongodb'
import type { FamilyInteraction, FamilyMemberRecord, UserAccount } from './definitions'
import { memberToAccount } from './members'

type StoredUserProfile = {
  userId: number
  avatar?: string
  updatedAt: Date
}

export async function fetchFamilyAccounts(): Promise<UserAccount[]> {
  try {
    const client = await clientPromise
    const members = await client.db('main').collection<FamilyMemberRecord>('familyMembers')
      .find({})
      .sort({ userId: 1 })
      .toArray()
    const profiles = await client.db('main').collection<StoredUserProfile>('userProfiles')
      .find({ userId: { $in: members.map(member => member.userId) } })
      .toArray()
    const profileMap = new Map(profiles.map(profile => [profile.userId, profile]))

    return members.map(member => ({
      ...memberToAccount(member),
      avatar: profileMap.get(member.userId)?.avatar,
    }))
  } catch (error) {
    console.error('Error fetching family profiles:', error)
    return []
  }
}

export async function fetchFamilyAccount(userId: number): Promise<UserAccount | undefined> {
  try {
    const client = await clientPromise
    const member = await client.db('main').collection<FamilyMemberRecord>('familyMembers').findOne({ userId })
    if (!member) return undefined
    const profile = await client.db('main').collection<StoredUserProfile>('userProfiles').findOne({ userId })
    return { ...memberToAccount(member), avatar: profile?.avatar }
  } catch (error) {
    console.error('Error fetching family profile:', error)
    return undefined
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
