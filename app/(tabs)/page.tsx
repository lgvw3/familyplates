import NotificationManager from '@/components/push-notifications/notification-manager'
import { RecentAnnotations } from '@/components/recent-annotations'

export const instant = true

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 md:px-8">
        <NotificationManager />
      </div>
      <RecentAnnotations />
    </main>
  )
}
