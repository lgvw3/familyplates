'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Reply } from 'lucide-react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Virtuoso } from 'react-virtuoso'
import type { UserAccount } from '@/lib/auth/definitions'
import { usersToMap } from '@/lib/auth/account-utils'
import { fetchNotificationPage } from '@/lib/notifications/data'
import { formatNotificationExcerpt, notificationCountKey, notificationListKey } from '@/lib/notifications/query'
import type { InAppNotification, NotificationCursor, NotificationPage } from '@/types/notifications'
import { useWebSocket } from '@/hooks/use-websockets'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

function notificationLabel(notification: InAppNotification) {
  if (notification.kind === 'reply') return `${notification.actorName} replied to your comment`
  if (notification.kind === 'comment') return `${notification.actorName} commented on your annotation`
  if (notification.kind === 'comment-like') return `${notification.actorName} liked your comment`
  return `${notification.actorName} liked your annotation`
}

function NotificationIcon({ kind }: { kind: InAppNotification['kind'] }) {
  if (kind === 'reply') return <Reply className="size-4" />
  if (kind === 'comment') return <MessageCircle className="size-4" />
  return <Heart className="size-4" />
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function NotificationList({
  initialPage,
  sessionStartedAt,
  users,
}: {
  initialPage: NotificationPage
  sessionStartedAt: string
  users: UserAccount[]
}) {
  const queryClient = useQueryClient()
  const userMap = usersToMap(users)
  useWebSocket()
  const notifications = useInfiniteQuery({
    queryKey: notificationListKey,
    queryFn: async ({ pageParam }) => {
      const page = await fetchNotificationPage({ limit: 20, cursor: pageParam })
      await queryClient.invalidateQueries({ queryKey: notificationCountKey })
      return page
    },
    initialPageParam: null as NotificationCursor | null,
    initialData: { pages: [initialPage], pageParams: [null] },
    getNextPageParam: page => page.nextCursor ?? undefined,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const byId = new Map(notifications.data.pages.flatMap(page => page.items).map(item => [item.id, item]))
  const items = [...byId.values()]
  const loadMore = () => {
    if (notifications.hasNextPage && !notifications.isFetchingNextPage) void notifications.fetchNextPage()
  }

  if (notifications.isError && !items.length) {
    return (
      <div className="rounded-lg border border-destructive/40 p-8 text-center">
        <p className="font-medium text-destructive">Could not load notifications</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void notifications.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">No notifications yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Replies, comments, and likes on your posts will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <Virtuoso
        style={{ width: '100%' }}
        data={items}
        useWindowScroll
        endReached={loadMore}
        className="scrollbar-hide bg-card"
        itemContent={(_, notification) => {
          const actor = userMap.get(notification.actorUserId)
          const highlighted = !notification.readAt || new Date(notification.readAt).getTime() >= new Date(sessionStartedAt).getTime()
          return (
            <Link
              key={notification.id}
              href={notification.targetPath}
              className={`flex gap-3 border-b border-border/70 px-4 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-8 ${highlighted ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent/50'}`}
            >
              <span className="relative shrink-0">
                <Avatar className="size-11">
                  <AvatarImage src={actor?.avatar} alt={actor ? `${actor.name}'s profile photo` : notification.actorName} className="object-cover" />
                  <AvatarFallback>{getInitials(actor?.name ?? notification.actorName)}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground">
                  <NotificationIcon kind={notification.kind} />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-medium text-foreground">{notificationLabel(notification)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                </span>
                <span className="mt-1 block whitespace-pre-wrap text-sm text-muted-foreground">{formatNotificationExcerpt(notification.excerpt)}</span>
              </span>
              {highlighted && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread when this page opened" />}
            </Link>
          )
        }}
      />
      {notifications.isFetchingNextPage && (
        <p className="p-4 text-center text-sm text-muted-foreground" role="status">Loading more notifications…</p>
      )}
      {notifications.isError && (
        <div className="flex items-center justify-center gap-3 border-t p-3 text-sm text-destructive">
          <span>Could not refresh notifications.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void notifications.refetch()}>Try again</Button>
        </div>
      )}
      <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))]" />
    </>
  )
}
