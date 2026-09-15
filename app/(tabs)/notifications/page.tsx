import type { Metadata } from 'next'
import { NotificationList } from '@/components/notifications/notification-list'

export const metadata: Metadata = {
  title: 'Notifications | Family Plates',
  description: 'Comments, replies, and likes from your family.',
}

export const instant = true

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-background">
      <NotificationList />
    </main>
  )
}
