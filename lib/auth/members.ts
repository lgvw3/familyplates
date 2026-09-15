import 'server-only'

import clientPromise from '@/lib/mongodb'
import type { FamilyMemberRecord, UserAccount } from './definitions'
import { normalizeEmail } from './member-values'

const COLLECTION = 'familyMembers'

async function familyMembersCollection() {
  const client = await clientPromise
  return client.db('main').collection<FamilyMemberRecord>(COLLECTION)
}

export async function findFamilyMemberByEmail(email: string): Promise<FamilyMemberRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  const collection = await familyMembersCollection()
  const stored = await collection.findOne({ normalizedEmails: normalizedEmail })
  if (stored) return stored.enabled === false ? null : stored
  return null
}

export async function findFamilyMemberForAuthUser(
  authUserId: string,
  email: string,
): Promise<FamilyMemberRecord | null> {
  const collection = await familyMembersCollection()
  const linkedMember = await collection.findOne({ authUserId })
  if (linkedMember) return linkedMember.enabled === false ? null : linkedMember

  const member = await findFamilyMemberByEmail(email)
  if (!member || (member.authUserId && member.authUserId !== authUserId)) return null

  const result = await collection.findOneAndUpdate(
    {
      userId: member.userId,
      $or: [
        { authUserId: { $exists: false } },
        { authUserId: null },
        { authUserId },
      ],
    },
    { $set: { authUserId, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )

  return result?.enabled === false ? null : result
}

export async function linkAuthUserToFamilyMember(email: string, authUserId: string) {
  return findFamilyMemberForAuthUser(authUserId, email)
}

export function memberToAccount(member: FamilyMemberRecord, email?: string): UserAccount {
  return {
    id: member.userId,
    name: member.name,
    ...(email ? { email: normalizeEmail(email) } : {}),
  }
}
