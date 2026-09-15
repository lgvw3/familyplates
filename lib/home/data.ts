'use server'

import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { fetchBookmarkBySignedInUser } from '@/lib/reading/data'

export async function fetchHomeContext() {
  const currentUserId = await fetchCurrentUserId()
  const [bookmark, users] = await Promise.all([
    fetchBookmarkBySignedInUser(),
    fetchFamilyAccounts(),
  ])

  return { currentUserId, bookmark, users }
}
