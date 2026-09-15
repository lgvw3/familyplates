'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Annotation, AnnotationComment, AnnotationLike } from '@/types/scripture'
import { fetchRealtimeTicket } from '@/lib/auth/realtime-ticket'
import { getAnnotationTargetKey } from '@/lib/annotations/presentation'
import {
  annotationTargetKey,
  annotationUpdatesChannel,
  parseAnnotationUpdate,
} from '@/lib/annotations/realtime'
import {
  annotationCollectionKey,
  annotationCollectionRootKey,
  annotationKey,
  annotationRootKey,
  feedRootKey,
} from '@/lib/annotations/query'

export type NotificationParam = {
  annotation?: Annotation
  comment?: AnnotationComment
  like?: AnnotationLike
  doesLike?: boolean
  userName: string
  userId: number
  type: 'annotation' | 'comment' | 'like'
}

export function useWebSocket() {
  const queryClient = useQueryClient()
  const [retryTick, setRetryTick] = useState(0)
  const [notification, setNotification] = useState<NotificationParam | null>(null)
  const reconnectPendingRef = useRef(false)
  const retryAttemptRef = useRef(0)

  const invalidateAnnotationQueries = useCallback((id: string, annotationTargetKey: string | null) => {
    if (!id) return
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: annotationKey(id) }),
      ...(annotationTargetKey
        ? [queryClient.invalidateQueries({ queryKey: annotationCollectionKey(annotationTargetKey) })]
        : []),
      queryClient.invalidateQueries({ queryKey: feedRootKey }),
    ])
  }, [queryClient])

  const invalidateAnnotation = useCallback((annotation: Annotation) => {
    const id = annotation._id?.toString()
    if (!id) return
    invalidateAnnotationQueries(id, getAnnotationTargetKey(annotation))
  }, [invalidateAnnotationQueries])

  useEffect(() => {
    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const connect = async () => {
      const ticket = await fetchRealtimeTicket()
      if (disposed) return
      if (!ticket || !process.env.NEXT_PUBLIC_WEB_SOCKET_URL) {
        console.warn('Realtime updates are not configured')
        return
      }
      const websocketUrl = new URL(process.env.NEXT_PUBLIC_WEB_SOCKET_URL)
      websocketUrl.searchParams.set('ticket', ticket)
      ws = new WebSocket(websocketUrl)
      ws.onopen = () => {
        if (disposed) return
        const reconnecting = reconnectPendingRef.current
        reconnectPendingRef.current = false
        retryAttemptRef.current = 0
        if (reconnecting) {
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: annotationRootKey }),
            queryClient.invalidateQueries({ queryKey: annotationCollectionRootKey }),
            queryClient.invalidateQueries({ queryKey: feedRootKey }),
          ])
        }
      }
      ws.onmessage = event => {
        if (disposed) return
        let envelope: { channel?: string; data?: string }
        try {
          envelope = JSON.parse(event.data)
        } catch (error) {
          console.error('Invalid WebSocket message:', error)
          return
        }
        if (envelope.channel === 'annotations') {
          if (!envelope.data) return
          const annotation: Annotation = JSON.parse(envelope.data)
          invalidateAnnotation(annotation)
          setNotification({ annotation, userName: annotation.userName, userId: annotation.userId, type: 'annotation' })
          return
        }
        if (envelope.channel === annotationUpdatesChannel) {
          if (!envelope.data) return
          const data = parseAnnotationUpdate(envelope.data)
          if (!data) return
          invalidateAnnotationQueries(data.annotationId, annotationTargetKey(data.target))
          return
        }
        if (envelope.channel === 'comments') {
          if (!envelope.data) return
          const data: { annotationId: string; comment: AnnotationComment } = JSON.parse(envelope.data)
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: annotationKey(data.annotationId) }),
            queryClient.invalidateQueries({ queryKey: annotationCollectionRootKey }),
            queryClient.invalidateQueries({ queryKey: feedRootKey }),
          ])
          setNotification({ comment: data.comment, userName: data.comment.userName, userId: data.comment.userId, type: 'comment' })
          return
        }
        if (envelope.channel === 'likes') {
          if (!envelope.data) return
          const data: { liked: boolean; like: AnnotationLike; annotationId: string } = JSON.parse(envelope.data)
          void queryClient.invalidateQueries({ queryKey: annotationKey(data.annotationId) })
          if (data.liked) setNotification({ like: data.like, doesLike: true, userName: data.like.userName, userId: data.like.userId, type: 'like' })
          return
        }
        if (envelope.channel === 'commentLikes') {
          if (!envelope.data) return
          const data: { liked: boolean; like: AnnotationLike; annotationId: string; commentId: string } = JSON.parse(envelope.data)
          void queryClient.invalidateQueries({ queryKey: annotationKey(data.annotationId) })
          if (data.liked) setNotification({ like: data.like, doesLike: true, userName: data.like.userName, userId: data.like.userId, type: 'like' })
        }
      }
      ws.onerror = error => console.error('WebSocket error:', error)
      ws.onclose = () => {
        if (disposed) return
        // Any unexpected close creates a window in which Redis events may be
        // missed, including a failed initial connection that later succeeds.
        reconnectPendingRef.current = true
        const delay = Math.min(1000 * 2 ** retryAttemptRef.current, 30_000)
        retryAttemptRef.current += 1
        retryTimer = setTimeout(() => setRetryTick(tick => tick + 1), delay)
      }
    }
    void connect()
    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [invalidateAnnotation, invalidateAnnotationQueries, queryClient, retryTick])

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WEB_SOCKET_URL?.replace('wss', 'https').replace('ws', 'http')}/health`)
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  return { checkServerHealth, invalidateAnnotation, notification, setNotification }
}
