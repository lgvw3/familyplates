'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Annotation, AnnotationComment, AnnotationLike } from '@/types/scripture'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { getAnnotationTargetKey } from '@/lib/annotations/presentation'
import { annotationCollectionKey, annotationKey, appendComment } from '@/lib/annotations/query'

export type NotificationParam = {
  annotation?: Annotation
  comment?: AnnotationComment
  like?: AnnotationLike
  doesLike?: boolean
  userName: string
  userId: number
  type: 'annotation' | 'comment' | 'like'
}

export function useWebSocket(targetKey?: string) {
  const queryClient = useQueryClient()
  const [retryCount, setRetryCount] = useState(0)
  const [notification, setNotification] = useState<NotificationParam | null>(null)

  const addAnnotation = useCallback((annotation: Annotation) => {
    const id = annotation._id?.toString()
    if (!id) return
    queryClient.setQueryData(annotationKey(id), annotation)
    if (targetKey && getAnnotationTargetKey(annotation) === targetKey) {
      queryClient.setQueryData<string[]>(annotationCollectionKey(targetKey), current =>
        current?.includes(id) ? current : [...(current ?? []), id],
      )
    }
  }, [queryClient, targetKey])

  useEffect(() => {
    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const connect = async () => {
      const userId = await fetchCurrentUserId()
      if (disposed) return
      ws = new WebSocket(`${process.env.NEXT_PUBLIC_WEB_SOCKET_URL}?userId=${userId}`)
      ws.onopen = () => setRetryCount(0)
      ws.onmessage = event => {
        const envelope = JSON.parse(event.data)
        if (envelope.channel === 'annotations') {
          const annotation: Annotation = JSON.parse(envelope.data)
          addAnnotation(annotation)
          setNotification({ annotation, userName: annotation.userName, userId: annotation.userId, type: 'annotation' })
          return
        }
        if (envelope.channel === 'comments') {
          const data: { annotationId: string; comment: AnnotationComment } = JSON.parse(envelope.data)
          queryClient.setQueryData<Annotation>(annotationKey(data.annotationId), current => current && appendComment(current, data.comment))
          setNotification({ comment: data.comment, userName: data.comment.userName, userId: data.comment.userId, type: 'comment' })
          return
        }
        if (envelope.channel === 'likes') {
          const data: { likes: boolean; like: AnnotationLike; annotationId: string } = JSON.parse(envelope.data)
          queryClient.setQueryData<Annotation>(annotationKey(data.annotationId), current => current && ({
            ...current,
            likes: data.likes
              ? [...current.likes.filter(like => like.userId !== data.like.userId), data.like]
              : current.likes.filter(like => like.userId !== data.like.userId),
          }))
          if (data.likes) setNotification({ like: data.like, doesLike: true, userName: data.like.userName, userId: data.like.userId, type: 'like' })
          return
        }
        if (envelope.channel === 'commentLikes') {
          const data: { likes: boolean; like: AnnotationLike; annotationId: string; commentId: string } = JSON.parse(envelope.data)
          queryClient.setQueryData<Annotation>(annotationKey(data.annotationId), current => current && ({
            ...current,
            comments: current.comments.map(comment => comment._id.toString() !== data.commentId ? comment : ({
              ...comment,
              likes: data.likes
                ? [...(comment.likes ?? []).filter(like => like.userId !== data.like.userId), data.like]
                : (comment.likes ?? []).filter(like => like.userId !== data.like.userId),
            })),
          }))
          if (data.likes) setNotification({ like: data.like, doesLike: true, userName: data.like.userName, userId: data.like.userId, type: 'like' })
        }
      }
      ws.onerror = error => console.error('WebSocket error:', error)
      ws.onclose = () => {
        if (disposed) return
        retryTimer = setTimeout(() => setRetryCount(count => count + 1), Math.min(1000 * 2 ** retryCount, 30_000))
      }
    }
    void connect()
    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [addAnnotation, queryClient, retryCount])

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WEB_SOCKET_URL?.replace('wss', 'https').replace('ws', 'http')}/health`)
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  return { checkServerHealth, addAnnotation, notification, setNotification }
}
