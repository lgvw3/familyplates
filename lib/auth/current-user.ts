import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from './auth'
import type { UserAccount } from './definitions'
import { findFamilyMemberByEmail, memberToAccount } from './members'

export async function getFamilyMemberForHeaders(requestHeaders: Headers): Promise<UserAccount | null> {
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user.email) return null

  const member = await findFamilyMemberByEmail(session.user.email)
  if (!member) return null

  return {
    ...memberToAccount(member, session.user.email),
    avatar: session.user.image ?? undefined,
  }
}

export const getCurrentFamilyMember = cache(async (): Promise<UserAccount | null> => (
  getFamilyMemberForHeaders(await headers())
))

export async function requireCurrentFamilyMember(): Promise<UserAccount> {
  const member = await getCurrentFamilyMember()
  if (!member) redirect('/sign-in')
  return member
}
