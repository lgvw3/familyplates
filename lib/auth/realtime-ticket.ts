'use server'

import { createHmac } from 'crypto'
import { requireCurrentFamilyMember } from './current-user'

const TICKET_TTL_SECONDS = 60

export async function fetchRealtimeTicket(): Promise<string | null> {
  const secret = process.env.REALTIME_AUTH_SECRET
  if (!secret) return null

  const { id: userId } = await requireCurrentFamilyMember()
  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + TICKET_TTL_SECONDS,
  }), 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}
