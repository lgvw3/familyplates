import NotificationManager from "@/components/push-notifications/notification-manager"
import { RecentAnnotations } from "@/components/recent-annotations"
import { HomeFeedSkeleton } from "@/components/skeletons/home-feed-skeleton"
import { fetchRecentAnnotations } from "@/lib/annotations/data"
import { fetchCurrentUserId } from "@/lib/auth/data"
import { fetchBookmarkBySignedInUser } from "@/lib/reading/data"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function RecentAnnotationsSection({ currentUserId }: { currentUserId: number }) {
  const [bookmark, recentAnnotations] = await Promise.all([fetchBookmarkBySignedInUser(), fetchRecentAnnotations()])
  return (
    <RecentAnnotations 
      recentAnnotations={recentAnnotations}
      currentUserId={currentUserId}
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
    <main>
      <div className="px-4 md:px-8">
        <NotificationManager/>
      </div>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  )
}
