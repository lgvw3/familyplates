'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { Virtuoso } from 'react-virtuoso'
import { motion } from 'framer-motion'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { FeedCursor, FeedPage } from '@/types/feed'
import { usersToMap } from '@/lib/auth/account-utils'
import { fetchFeedPage } from '@/lib/annotations/data'
import { fetchHomeContext } from '@/lib/home/data'
import { useWebSocket } from '@/hooks/use-websockets'
import { FeedActivityCard } from '@/components/feed/feed-activity-card'
import { AnnotationCreation } from '@/components/feed/annotation-creation'
import { ContinueReading } from '@/components/continue-reading'
import { Button } from '@/components/ui/button'
import { HomeFeedSkeleton } from '@/components/skeletons/home-feed-skeleton'
import { feedKey, homeContextKey } from '@/lib/annotations/query'

export function RecentAnnotations() {
  const queryClient = useQueryClient()
  const sessionStartedAt = useRef(
    queryClient.getQueryData<InfiniteData<FeedPage>>(feedKey)?.pages[0]?.sessionStartedAt,
  )
  const home = useQuery({ queryKey: homeContextKey, queryFn: fetchHomeContext })
  const currentUserId = home.data?.currentUserId ?? 0
  const userMap = usersToMap(home.data?.users ?? [])
  const currentUserName = userMap.get(currentUserId)?.name ?? ''
  const feed = useInfiniteQuery({
    queryKey: feedKey,
    queryFn: async ({ pageParam }) => {
      const page = await fetchFeedPage({
        limit: 15,
        cursor: pageParam,
        sessionStartedAt: pageParam ? sessionStartedAt.current : undefined,
      })
      if (!page) throw new Error('Could not load the feed')
      sessionStartedAt.current = page.sessionStartedAt
      return page
    },
    initialPageParam: null as FeedCursor | null,
    getNextPageParam: page => page.nextCursor ?? undefined,
  })
  const activities = useMemo(() => {
    const byKey = new Map((feed.data?.pages ?? []).flatMap(page => page.items).map(activity => [activity.key, activity]))
    return [...byKey.values()]
  }, [feed.data?.pages])
  const { notification, setNotification } = useWebSocket()
  const [scroller, setScroller] = useState<HTMLElement | Window | null>(null)
  const [actionsVisible, setActionsVisible] = useState(true)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!notification || !home.data) return
    if (notification.userId !== currentUserId) {
      toast(`New ${notification.type} by ${notification.userName}`, { position: 'top-center' })
    }
    setNotification(null)
  }, [currentUserId, home.data, notification, setNotification])

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

  const loadMore = () => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
  }

  if (!home.data || !feed.data) return <HomeFeedSkeleton />

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
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-40 flex items-center gap-3"
        style={{ pointerEvents: actionsVisible ? 'auto' : 'none' }}
      >
        <AnnotationCreation
          user={userMap.get(currentUserId)}
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
        <ContinueReading bookmark={home.data.bookmark} />
      </motion.div>
      <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))]" />
    </>
  )
}
