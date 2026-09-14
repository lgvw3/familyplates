'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { FeedActivity } from '@/types/feed'
import type { UserAccount } from '@/lib/auth/definitions'
import { markFeedActivitiesSeen } from '@/lib/annotations/actions'
import { getAnnotationReference } from '@/lib/annotations/presentation'
import { cn, getInitials } from '@/lib/utils'
import AnnotationViewer from '@/components/feed/annotation-viewer'
import { CommentTree } from '@/components/feed/comment-thread'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { useAnnotation } from '@/lib/annotations/query'

function SeenWhenVisible({ activity, children }: { activity: FeedActivity; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activity.unseen || !ref.current) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          void markFeedActivitiesSeen(activity.seenKeys)
          observer.disconnect()
        }, 650)
      } else if (timer) {
        clearTimeout(timer)
      }
    }, { threshold: [0] })
    observer.observe(ref.current)
    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [activity])

  return <div ref={ref}>{children}</div>
}

function AnnotationThreadContext({
  annotation,
  author,
  onOpen,
}: {
  annotation: FeedActivity['annotation']
  author: UserAccount
  onOpen: () => void
}) {
  const reference = getAnnotationReference(annotation)

  return (
    <button
      type="button"
      className="relative flex w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-accent/40 after:absolute after:bottom-0 after:left-11 after:top-14 after:w-px after:bg-border"
      onClick={onOpen}
    >
      <Avatar className="z-10 size-10 bg-card ring-4 ring-card">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold">{annotation.userName}</span>
          {reference && <span className="text-xs text-muted-foreground">on {reference}</span>}
        </div>
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-foreground">{annotation.text}</p>
      </div>
    </button>
  )
}

export function FeedActivityCard({
  activity,
  index,
  userMap,
  currentUserId,
  currentUserName,
}: {
  activity: FeedActivity
  index: number
  userMap: Map<number, UserAccount>
  currentUserId: number
  currentUserName: string
}) {
  const router = useRouter()
  const annotation = useAnnotation(activity.annotation)
  const annotationId = annotation._id?.toString() ?? ''
  const contextCommentIds = new Set(activity.contextComments?.map(comment => comment._id.toString()))
  const contextComments = annotation.comments.filter(comment => contextCommentIds.has(comment._id.toString()))
  const author = userMap.get(annotation.userId)
  if (!author) return null

  if (activity.kind === 'annotation') {
    return (
      <SeenWhenVisible activity={activity}>
        <div className="md:px-8">
          <AnnotationViewer
            index={index}
            author={author}
            annotation={annotation}
            userMap={userMap}
            currentUserId={currentUserId}
            annotationHref={`/annotation/${annotationId}`}
            threaded={Boolean(contextComments.length)}
          />
          {contextComments.length ? (
            <Card className="rounded-none border-t-0">
              <CommentTree
                annotationId={annotationId}
                comments={contextComments}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                userMap={userMap}
                connectedToAnnotation
              />
            </Card>
          ) : null}
        </div>
      </SeenWhenVisible>
    )
  }

  const comment = annotation.comments.find(item => item._id.toString() === activity.comment?._id.toString())
  if (!comment) return null
  const commentHref = `/annotation/${annotationId}?comment=${comment._id.toString()}#comment-${comment._id.toString()}`
  const threadComments = activity.parentComment
    ? [
        { ...(annotation.comments.find(item => item._id.toString() === activity.parentComment?._id.toString()) ?? activity.parentComment), parentCommentId: undefined },
        comment,
      ]
    : [{ ...comment, parentCommentId: undefined }]

  return (
    <SeenWhenVisible activity={activity}>
      <div className="md:px-8">
        <Card className={cn('cursor-pointer rounded-none', index === 0 && 'border-t-0')} onClick={event => {
          if ((event.target as HTMLElement).closest('button, textarea, input, a')) return
          router.push(commentHref)
        }}>
          <AnnotationThreadContext
            annotation={annotation}
            author={author}
            onOpen={() => router.push(`/annotation/${annotationId}`)}
          />
          <CommentTree
            annotationId={annotationId}
            comments={threadComments}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            userMap={userMap}
            connectedToAnnotation
          />
        </Card>
      </div>
    </SeenWhenVisible>
  )
}
