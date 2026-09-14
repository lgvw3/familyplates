'use client'

import { useEffect, useRef, useState } from 'react'
import { HeartIcon, Loader2Icon, MessageCircleIcon } from 'lucide-react'
import type { AnnotationComment, AnnotationLike } from '@/types/scripture'
import type { UserAccount } from '@/lib/auth/definitions'
import { addCommentToAnnotation, markFeedActivitiesSeen, updateLikeStatusOfComment } from '@/lib/annotations/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

function formatActivityDate(value: Date) {
  const date = new Date(value)
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  }).format(date)
}

export function CommentCard({
  annotationId,
  comment,
  currentUserId,
  currentUserName,
  userMap,
  compact = false,
  onCommentAdded,
}: {
  annotationId: string
  comment: AnnotationComment
  currentUserId: number
  currentUserName: string
  userMap: Map<number, UserAccount>
  compact?: boolean
  onCommentAdded?: (comment: AnnotationComment) => void
}) {
  const commentId = comment._id.toString()
  const initialLikes = comment.likes ?? []
  const [userLike, setUserLike] = useState<AnnotationLike | undefined>(
    initialLikes.find(like => like.userId === currentUserId),
  )
  const [likeCount, setLikeCount] = useState(initialLikes.length)
  const [replyOpen, setReplyOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [savingReply, setSavingReply] = useState(false)
  const author = userMap.get(comment.userId)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          void markFeedActivitiesSeen([`comment:${commentId}`])
          observer.disconnect()
        }, 650)
      } else if (timer) {
        clearTimeout(timer)
      }
    }, { threshold: [0] })
    observer.observe(element)
    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [commentId])

  const toggleLike = async () => {
    const previous = userLike
    const optimisticLike = previous ? undefined : {
      _id: '',
      userId: currentUserId,
      userName: currentUserName,
      timeStamp: new Date(),
    }
    setUserLike(optimisticLike)
    setLikeCount(count => Math.max(0, count + (previous ? -1 : 1)))
    const result = await updateLikeStatusOfComment(annotationId, commentId)
    if (result.message !== 'Success') {
      setUserLike(previous)
      setLikeCount(initialLikes.length)
      toast.warning(result.message as string)
    }
  }

  const saveReply = async () => {
    setSavingReply(true)
    const result = await addCommentToAnnotation(reply, annotationId, commentId)
    if (result.newComment) {
      onCommentAdded?.(result.newComment as AnnotationComment)
      setReply('')
      setReplyOpen(false)
      toast.success('Reply shared!')
    } else {
      toast.warning(result.message as string)
    }
    setSavingReply(false)
  }

  return (
    <article
      ref={rootRef}
      id={`comment-${commentId}`}
      className={cn(
        'scroll-mt-24 py-4 transition-colors target:bg-accent/70',
        compact ? 'px-3' : 'px-6',
      )}
    >
      <div className="flex gap-3">
        <Link href={`/family/${comment.userId}`} className="z-10" aria-label={`View ${comment.userName}'s profile`}>
          <Avatar className={cn('bg-card ring-4 ring-card', compact ? 'size-8' : 'size-10')}>
            <AvatarImage src={author?.avatar} alt={author?.name ?? comment.userName} className="object-cover" />
            <AvatarFallback>{getInitials(author?.name ?? comment.userName)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/family/${comment.userId}`} className="font-semibold text-sm hover:underline">{comment.userName}</Link>
            <span className="text-xs text-muted-foreground">{formatActivityDate(comment.timeStamp)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-2 text-muted-foreground"
              onClick={() => setReplyOpen(open => !open)}
            >
              <MessageCircleIcon className="size-4" /> Reply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-2 text-muted-foreground"
              onClick={toggleLike}
              aria-label={userLike ? 'Unlike comment' : 'Like comment'}
            >
              <HeartIcon className={cn('size-4', userLike && 'fill-red-500 stroke-red-500')} />
              {likeCount || null}
            </Button>
          </div>
          {replyOpen && (
            <div className="mt-3 space-y-2">
              <AutoResizeTextarea
                autoFocus
                value={reply}
                placeholder={`Reply to ${comment.userName.split(' ')[0]}`}
                onChange={event => setReply(event.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={!reply.trim() || savingReply} onClick={saveReply}>
                  {savingReply ? <Loader2Icon className="size-4 animate-spin" /> : 'Reply'}
                </Button>
                <Button size="sm" variant="ghost" disabled={savingReply} onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export function CommentTree({
  annotationId,
  comments,
  currentUserId,
  currentUserName,
  userMap,
  parentCommentId,
  connectedToAnnotation = false,
  onCommentAdded,
}: {
  annotationId: string
  comments: AnnotationComment[]
  currentUserId: number
  currentUserName: string
  userMap: Map<number, UserAccount>
  parentCommentId?: string
  connectedToAnnotation?: boolean
  onCommentAdded?: (comment: AnnotationComment) => void
}) {
  const children = comments.filter(comment =>
    parentCommentId
      ? comment.parentCommentId?.toString() === parentCommentId
      : !comment.parentCommentId,
  )

  return (
    <div className={cn(
      'relative',
      connectedToAnnotation && 'before:absolute before:-top-4 before:left-11 before:h-4 before:w-px before:bg-border',
    )}>
      {children.map((comment, index) => {
        const commentId = comment._id.toString()
        const hasReplies = comments.some(candidate => candidate.parentCommentId?.toString() === commentId)
        const continues = index < children.length - 1 || hasReplies
        const nested = Boolean(parentCommentId)

        return (
          <div
            key={commentId}
            className={cn(
              'relative before:absolute before:top-0 before:w-px before:bg-border',
              nested
                ? 'before:left-0 after:absolute after:left-0 after:top-8 after:h-px after:w-3 after:bg-border'
                : 'before:left-11',
              continues ? 'before:bottom-0' : nested ? 'before:h-8' : 'before:h-9',
            )}
          >
            <CommentCard
              annotationId={annotationId}
              comment={comment}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              userMap={userMap}
              compact={nested}
              onCommentAdded={onCommentAdded}
            />
            {hasReplies && (
              <div className={nested ? 'ml-7' : 'ml-11'}>
                <CommentTree
                  annotationId={annotationId}
                  comments={comments}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  userMap={userMap}
                  parentCommentId={commentId}
                  onCommentAdded={onCommentAdded}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
