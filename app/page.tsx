import NotificationManager from "@/components/push-notifications/notification-manager"
import { RecentAnnotations } from "@/components/recent-annotations"
import { fetchRecentAnnotations } from "@/lib/annotations/data"
import { fetchCurrentUserId } from "@/lib/auth/data"
import { fetchUserNotificationSubscription } from "@/lib/push-notifications/data"
import { fetchBookmarkBySignedInUser } from "@/lib/reading/data"
import { loadChapter } from "@/lib/scripture_utils/scriptureUtils"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) {
    redirect('/sign-in')
  }
  const recentAnnotationsPromise = fetchRecentAnnotations()
  const subscriptionPromise = fetchUserNotificationSubscription()
  const bookmarkPromise = fetchBookmarkBySignedInUser()

  const [recentAnnotations, subscription, bookmark] = await Promise.all([recentAnnotationsPromise, subscriptionPromise, bookmarkPromise])

  const chapterData = bookmark ? loadChapter(bookmark.bookId, `chapter_${bookmark.chapterNumber.toString()}`) : null
  const progress = bookmark ? (bookmark.verseNumber / (chapterData?.verses.length ?? 1)) * 100 : 0

  return (
    <main className="">
      <div className="px-4 md:px-8">
        <NotificationManager 
          existingSubscription={subscription?.sub ?? null} 
        />
      </div>
      <RecentAnnotations 
        recentAnnotations={recentAnnotations ?? []} 
        currentUserId={currentUserId}
        bookmark={bookmark}
        chapterData={chapterData}
        progress={progress}
      />
    </main>
  )
}

