'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Virtuoso } from 'react-virtuoso'
import { motion } from 'framer-motion'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { FeedCursor, FeedPage } from '@/types/feed'
import type { BookmarkedSpot } from '@/lib/reading/definitions'
import { fetchUsersAsMap } from '@/lib/auth/accounts'
import { fetchFeedPage } from '@/lib/annotations/data'
import { useWebSocket } from '@/hooks/use-websockets'
import { FeedActivityCard } from '@/components/feed/feed-activity-card'
import { AnnotationCreation } from '@/components/feed/annotation-creation'
import { ContinueReading } from '@/components/continue-reading'
import { Button } from '@/components/ui/button'

export function RecentAnnotations({
  currentUserId,
  bookmark,
  initialFeed,
  sessionStartedAt,
}: {
  currentUserId: number
  bookmark: BookmarkedSpot | null
  initialFeed: FeedPage
  sessionStartedAt: string
}) {
  const router = useRouter()
  const userMap = fetchUsersAsMap()
  const currentUserName = userMap.get(currentUserId)?.name ?? ''
  const [activities, setActivities] = useState(initialFeed.items)
  const [nextCursor, setNextCursor] = useState<FeedCursor | null>(initialFeed.nextCursor)
  const { notification, setNotification } = useWebSocket([], false)
  const isLoading = useRef(false)
  const [scroller, setScroller] = useState<HTMLElement | Window | null>(null)
  const [actionsVisible, setActionsVisible] = useState(true)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!notification) return
    if (notification.userId !== currentUserId) {
      toast(`New ${notification.type} by ${notification.userName}`, { position: 'top-center' })
    }
    setNotification(null)
    if (notification.type !== 'like') router.refresh()
  }, [currentUserId, notification, router, setNotification])

  useEffect(() => {
    if (!scroller) return
    const getScrollTop = () => 'scrollY' in scroller ? scroller.scrollY : scroller.scrollTop
    lastScrollTop.current = getScrollTop()
    const handleScroll = () => {
      const currentScrollTop = getScrollTop()
      const delta = currentScrollTop - lastScrollTop.current
      if (Math.abs(delta) < 4) return
      setActionsVisible(delta < 0 || currentScrollTop <= 0)
      lastScrollTop.current = currentScrollTop
    }
    scroller.addEventListener('scroll', handleScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [scroller])

  const loadMore = async () => {
    if (isLoading.current || !nextCursor) return
    isLoading.current = true
    try {
      const page = await fetchFeedPage({ limit: 15, cursor: nextCursor, sessionStartedAt })
      if (!page) return
      setActivities(previous => {
        const knownKeys = new Set(previous.map(activity => activity.key))
        return [...previous, ...page.items.filter(activity => !knownKeys.has(activity.key))]
      })
      setNextCursor(page.nextCursor)
    } finally {
      isLoading.current = false
    }
  }

  return (
    <>
      <Virtuoso
        style={{ width: '100%' }}
        data={activities}
        scrollerRef={setScroller}
        useWindowScroll
        endReached={loadMore}
        itemContent={(index, activity) => (
          <FeedActivityCard
            activity={activity}
            index={index}
            userMap={userMap}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        )}
        className="scrollbar-hide"
      />
      <motion.div
        animate={{ opacity: actionsVisible ? 1 : 0, y: actionsVisible ? 0 : 24 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
        style={{ pointerEvents: actionsVisible ? 'auto' : 'none' }}
      >
        <AnnotationCreation
          renderTrigger={(onOpen) => (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-14 rounded-full shadow-lg shadow-black/25 transition-none hover:bg-secondary hover:text-secondary-foreground"
              aria-label="Create an unbound annotation"
              title="Create an unbound annotation"
              onClick={onOpen}
            >
              <PlusIcon className="size-7" />
            </Button>
          )}
        />
        <ContinueReading bookmark={bookmark} />
      </motion.div>
    </>
  )
}
