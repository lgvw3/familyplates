import NotificationManager from "@/components/push-notifications/notification-manager"
import { RecentAnnotations } from "@/components/recent-annotations"
import { HomeFeedSkeleton } from "@/components/skeletons/home-feed-skeleton"
import { fetchRecentAnnotations } from "@/lib/annotations/data"
import { fetchCurrentUserId } from "@/lib/auth/data"
import { fetchBookmarkBySignedInUser } from "@/lib/reading/data"
import { loadChapter } from "@/lib/scripture_utils/scriptureUtils"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function RecentAnnotationsSection({ currentUserId }: { currentUserId: number }) {
  const [bookmark, recentAnnotations] = await Promise.all([fetchBookmarkBySignedInUser(), fetchRecentAnnotations()])
  const chapterData = bookmark ? loadChapter(bookmark.bookId, `chapter_${bookmark.chapterNumber.toString()}`) : null
  const progress = bookmark ? (bookmark.verseNumber / (chapterData?.verses.length ?? 1)) * 100 : 0
  return (
    <RecentAnnotations 
      recentAnnotations={recentAnnotations}
      currentUserId={currentUserId}
      bookmark={bookmark}
      chapterData={chapterData}
      progress={progress}
    />
  )
}

export default async function HomePage() {
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) {
    redirect('/sign-in')
  }

  return (
    <main className="">
      <div className="px-4 md:px-8">
        <NotificationManager/>
      </div>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <RecentAnnotationsSection currentUserId={currentUserId} />
      </Suspense>
    </main>
  )
}

