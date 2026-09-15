import 'server-only'

import clientPromise from '@/lib/mongodb'
import { accounts } from './accounts'
import type { FamilyMemberRecord, UserAccount } from './definitions'
import { normalizeEmail, parseFamilyEmailConfiguration } from './email-configuration'

const COLLECTION = 'familyMembers'

function configuredEmailMap(): Map<string, number> {
  try {
    return parseFamilyEmailConfiguration(
      process.env.FAMILY_MEMBER_EMAILS_JSON,
      new Set(accounts.map(account => account.id)),
    ).byEmail
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid family email configuration')
    return new Map()
  }
}

async function upsertConfiguredMember(userId: number, email: string) {
  const account = accounts.find(candidate => candidate.id === userId)
  if (!account) return null

  const client = await clientPromise
  const collection = client.db('main').collection<FamilyMemberRecord>(COLLECTION)
  const now = new Date()
  await collection.updateOne(
    { userId },
    {
      $set: { name: account.name, updatedAt: now },
      $setOnInsert: { userId, enabled: true, createdAt: now },
      $addToSet: { normalizedEmails: email },
    },
    { upsert: true },
  )
  return collection.findOne({ userId })
}

export async function findFamilyMemberByEmail(email: string): Promise<FamilyMemberRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  const client = await clientPromise
  const collection = client.db('main').collection<FamilyMemberRecord>(COLLECTION)
  const stored = await collection.findOne({ normalizedEmails: normalizedEmail })
  if (stored) return stored.enabled === false ? null : stored

  const configuredUserId = configuredEmailMap().get(normalizedEmail)
  if (!configuredUserId) return null
  const configuredMember = await collection.findOne({ userId: configuredUserId })
  if (configuredMember?.enabled === false) return null
  return upsertConfiguredMember(configuredUserId, normalizedEmail)
}

export async function linkAuthUserToFamilyMember(email: string, authUserId: string) {
  const member = await findFamilyMemberByEmail(email)
  if (!member) return

  const client = await clientPromise
  await client.db('main').collection<FamilyMemberRecord>(COLLECTION).updateOne(
    { userId: member.userId },
    { $set: { authUserId, updatedAt: new Date() } },
  )
}

export function memberToAccount(member: FamilyMemberRecord, email?: string): UserAccount {
  return {
    id: member.userId,
    name: member.name,
    email: email ? normalizeEmail(email) : member.normalizedEmails[0],
  }
}
