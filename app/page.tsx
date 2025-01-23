import NotificationManager from "@/components/push-notifications/notification-manager"
import { RecentAnnotations } from "@/components/recent-annotations"
import { fetchRecentAnnotations } from "@/lib/annotations/data"
import { fetchCurrentUserId } from "@/lib/auth/data"
import { fetchUserNotificationSubscription } from "@/lib/push-notifications/data"
import { fetchBookmarkBySignedInUser } from "@/lib/reading/data"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import { loadChapter } from "@/lib/scripture_utils/scriptureUtils"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const recentAnnotations = await fetchRecentAnnotations()
  const subscription = await fetchUserNotificationSubscription()
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) {
    redirect('/sign-in')
  }
  const bookmark: BookmarkedSpot | null = await fetchBookmarkBySignedInUser()
  const chapterData = bookmark ? loadChapter(bookmark.bookId, `chapter_${bookmark.chapterNumber.toString()}`) : null
  const progress = bookmark ? (bookmark.verseNumber / (chapterData?.verses.length ?? 1)) * 100 : 0

  return (
    <div className="pt-8 mt-6">
      <NotificationManager 
        existingSubscription={subscription?.sub ?? null} 
      />
      <RecentAnnotations 
        recentAnnotations={recentAnnotations ?? []} 
        currentUserId={currentUserId}
        bookmark={bookmark}
        chapterData={chapterData}
        progress={progress}
      />
    </div>
  )
}

