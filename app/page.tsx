import NotificationManager from "@/components/push-notifications/notification-manager"
import { RecentAnnotations } from "@/components/recent-annotations"
import { Footer } from "@/components/footer"
import { HomeFeedSkeleton } from "@/components/skeletons/home-feed-skeleton"
import { fetchFeedPage } from "@/lib/annotations/data"
import { fetchCurrentUserId } from "@/lib/auth/data"
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { fetchBookmarkBySignedInUser } from "@/lib/reading/data"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function RecentAnnotationsSection({ currentUserId }: { currentUserId: number }) {
  const sessionStartedAt = new Date().toISOString()
  const [bookmark, initialFeed, users] = await Promise.all([
    fetchBookmarkBySignedInUser(),
    fetchFeedPage({ limit: 15, sessionStartedAt }),
    fetchFamilyAccounts(),
  ])
  if (!initialFeed) return null
  return (
    <RecentAnnotations 
      key={sessionStartedAt}
      initialFeed={initialFeed}
      sessionStartedAt={sessionStartedAt}
      currentUserId={currentUserId}
      users={users}
      bookmark={bookmark}
    />
  )
}

async function HomeContent() {
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) {
    redirect('/sign-in')
  }

  return <RecentAnnotationsSection currentUserId={currentUserId} />
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 md:px-8">
        <NotificationManager/>
      </div>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeContent />
      </Suspense>
      <Footer />
    </main>
  )
}
