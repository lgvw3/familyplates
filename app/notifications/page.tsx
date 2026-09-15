import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { NotificationList } from '@/components/notifications/notification-list'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { fetchNotificationPage } from '@/lib/notifications/data'

export const metadata: Metadata = {
  title: 'Notifications | Family Plates',
  description: 'Comments, replies, and likes from your family.',
}

export const instant = false

export default async function NotificationsPage() {
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) redirect('/sign-in')
  const sessionStartedAt = new Date().toISOString()
  const [initialPage, users] = await Promise.all([
    fetchNotificationPage({ limit: 20 }),
    fetchFamilyAccounts(),
  ])

  return (
    <main className="min-h-screen bg-background">
      <NotificationList initialPage={initialPage} sessionStartedAt={sessionStartedAt} users={users} />
      <Footer />
    </main>
  )
}
