'use server'

import { revalidatePath } from 'next/cache'
import clientPromise from '@/lib/mongodb'
import { fetchFamilyAccount } from './profiles'
import { getCurrentFamilyMember } from './current-user'

const AVATAR_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/
const MAX_AVATAR_BYTES = 500_000

export async function fetchCurrentFamilyAccount() {
  const user = await getCurrentFamilyMember()
  if (!user) return null
  return (await fetchFamilyAccount(user.id)) ?? null
}

export async function updateProfileAvatar(avatar: string) {
  const user = await getCurrentFamilyMember()
  if (!user) return { message: 'Unauthorized' }
  const userId = user.id

  if (typeof avatar !== 'string') return { message: 'Please choose a valid image.' }
  const match = AVATAR_DATA_URL.exec(avatar)
  if (!match) return { message: 'Please choose a JPEG, PNG, or WebP image.' }
  const estimatedBytes = Math.floor(match[2].length * 0.75)
  if (estimatedBytes > MAX_AVATAR_BYTES) return { message: 'That image is too large. Please choose a smaller photo.' }

  try {
    const client = await clientPromise
    await client.db('main').collection('userProfiles').updateOne(
      { userId },
      { $set: { userId, avatar, updatedAt: new Date() } },
      { upsert: true },
    )
    revalidatePath('/')
    revalidatePath(`/family/${userId}`)
    return { message: 'Success' }
  } catch (error) {
    console.error('Error updating profile photo:', error)
    return { message: 'Could not update your photo. Please try again.' }
  }
}
