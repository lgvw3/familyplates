'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Annotation, AnnotationLike } from '@/types/scripture'
import { addCommentToAnnotation, setAnnotationLiked, setCommentLiked } from './actions'
import { fetchAnnotationById, fetchAnnotationsByChapter, fetchAnnotationsByIntro } from './data'
import {
  annotationHasLike,
  commentHasLike,
  findUserLike,
  replaceAnnotationUserLike,
  replaceCommentUserLike,
} from './query-cache'

export const annotationRootKey = ['annotation'] as const
export const annotationCollectionRootKey = ['annotations'] as const
export const feedRootKey = ['feed'] as const

export const annotationKey = (id: string) => [...annotationRootKey, id] as const
export const annotationCollectionKey = (targetKey: string) => [...annotationCollectionRootKey, targetKey] as const
export const feedKey = (sessionStartedAt: string) => [...feedRootKey, sessionStartedAt] as const

export function annotationId(annotation: Annotation) {
  return annotation._id?.toString() ?? ''
}

async function fetchAnnotation(id: string) {
  const annotation = await fetchAnnotationById(id)
  if (!annotation) throw new Error('Annotation not found')
  return annotation
}

async function fetchAnnotationCollection(targetKey: string) {
  const scriptureTarget = /^scripture:(.+):(\d+)$/.exec(targetKey)
  if (scriptureTarget) {
    const annotations = await fetchAnnotationsByChapter(scriptureTarget[1], Number(scriptureTarget[2]))
    if (!annotations) throw new Error('Could not load annotations')
    return annotations
  }

  if (targetKey.startsWith('intro:')) {
    const annotations = await fetchAnnotationsByIntro(targetKey.slice('intro:'.length))
    if (!annotations) throw new Error('Could not load annotations')
    return annotations
  }

  throw new Error(`Unsupported annotation target: ${targetKey}`)
}

export function useAnnotation(initialAnnotation: Annotation) {
  const id = annotationId(initialAnnotation)
  return useQuery({
    queryKey: annotationKey(id),
    queryFn: () => fetchAnnotation(id),
    initialData: initialAnnotation,
  }).data
}

export function useAnnotationCollection(initialAnnotations: Annotation[], targetKey: string) {
  return useQuery({
    queryKey: annotationCollectionKey(targetKey),
    queryFn: () => fetchAnnotationCollection(targetKey),
    initialData: initialAnnotations,
  }).data
}

let optimisticLikeSequence = 0

function optimisticLike(userId: number, userName: string): AnnotationLike {
  optimisticLikeSequence += 1
  return { _id: `optimistic:${userId}:${optimisticLikeSequence}`, userId, userName, timeStamp: new Date() }
}

function mutationError(message: unknown) {
  return new Error(typeof message === 'string' ? message : 'Annotation update failed')
}

export function useSetAnnotationLiked(annotationId: string, userId: number, userName: string) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['annotation-like', annotationId, userId],
    scope: { id: `annotation-like:${userId}:${annotationId}` },
    mutationFn: async (liked: boolean) => {
      const result = await setAnnotationLiked(annotationId, liked)
      if (result.message !== 'Success') throw mutationError(result.message)
    },
    onMutate: async liked => {
      await client.cancelQueries({ queryKey: annotationKey(annotationId) })
      const current = client.getQueryData<Annotation>(annotationKey(annotationId))
      const previousLike = current && findUserLike(current.likes, userId)
      const optimistic = liked ? optimisticLike(userId, userName) : undefined
      client.setQueryData<Annotation>(annotationKey(annotationId), annotation =>
        annotation && replaceAnnotationUserLike(annotation, userId, optimistic),
      )
      return { previousLike, optimisticId: optimistic?._id.toString() }
    },
    onError: (_error, _liked, context) => client.setQueryData<Annotation>(annotationKey(annotationId), current => {
      if (!current || !context || !annotationHasLike(current, userId, context.optimisticId)) return current
      return replaceAnnotationUserLike(current, userId, context.previousLike)
    }),
    onSettled: () => client.invalidateQueries({ queryKey: annotationKey(annotationId) }),
  })
}

export function useSetCommentLiked(annotationId: string, commentId: string, userId: number, userName: string) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['comment-like', annotationId, commentId, userId],
    scope: { id: `comment-like:${userId}:${annotationId}:${commentId}` },
    mutationFn: async (liked: boolean) => {
      const result = await setCommentLiked(annotationId, commentId, liked)
      if (result.message !== 'Success') throw mutationError(result.message)
    },
    onMutate: async liked => {
      await client.cancelQueries({ queryKey: annotationKey(annotationId) })
      const current = client.getQueryData<Annotation>(annotationKey(annotationId))
      const comment = current?.comments.find(item => item._id.toString() === commentId)
      const previousLike = comment && findUserLike(comment.likes ?? [], userId)
      const optimistic = liked ? optimisticLike(userId, userName) : undefined
      client.setQueryData<Annotation>(annotationKey(annotationId), annotation =>
        annotation && replaceCommentUserLike(annotation, commentId, userId, optimistic),
      )
      return { previousLike, optimisticId: optimistic?._id.toString() }
    },
    onError: (_error, _liked, context) => client.setQueryData<Annotation>(annotationKey(annotationId), current => {
      if (!current || !context || !commentHasLike(current, commentId, userId, context.optimisticId)) return current
      return replaceCommentUserLike(current, commentId, userId, context.previousLike)
    }),
    onSettled: () => client.invalidateQueries({ queryKey: annotationKey(annotationId) }),
  })
}

export function useAddComment(annotationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['annotation-comment', annotationId],
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      const result = await addCommentToAnnotation(content, annotationId, parentCommentId)
      if (result.message !== 'Success') throw mutationError(result.message)
    },
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: annotationKey(annotationId) }),
      client.invalidateQueries({ queryKey: annotationCollectionRootKey }),
      client.invalidateQueries({ queryKey: feedRootKey }),
    ]),
  })
}
