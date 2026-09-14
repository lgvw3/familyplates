'use client'

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Annotation, AnnotationComment, AnnotationLike } from '@/types/scripture'
import { addCommentToAnnotation, setAnnotationLiked, setCommentLiked } from './actions'

export const annotationKey = (id: string) => ['annotation', id] as const
export const annotationCollectionKey = (targetKey: string) => ['annotations', targetKey] as const

export function annotationId(annotation: Annotation) {
  return annotation._id?.toString() ?? ''
}

export function useAnnotation(initialAnnotation: Annotation) {
  const id = annotationId(initialAnnotation)
  return useQuery({
    queryKey: annotationKey(id),
    queryFn: () => Promise.resolve(initialAnnotation),
    initialData: initialAnnotation,
  }).data
}

export function useHydrateAnnotations(annotations: Annotation[]) {
  useQueries({
    queries: annotations.map(annotation => ({
      queryKey: annotationKey(annotationId(annotation)),
      queryFn: () => Promise.resolve(annotation),
      initialData: annotation,
    })),
  })
}

export function useAnnotationCollection(initialAnnotations: Annotation[], targetKey: string) {
  const ids = initialAnnotations.map(annotationId).filter(Boolean)
  const initialById = new Map(initialAnnotations.map(annotation => [annotationId(annotation), annotation]))
  const collection = useQuery({
    queryKey: annotationCollectionKey(targetKey),
    queryFn: () => Promise.resolve(ids),
    initialData: ids,
  }).data
  return useQueries({
    queries: collection.map(id => ({
      queryKey: annotationKey(id),
      queryFn: (): Promise<Annotation> => Promise.reject(new Error(`Annotation ${id} has not been hydrated`)),
      initialData: initialById.get(id),
      enabled: false,
    })),
    combine: results => results.flatMap(result => result.data ? [result.data as Annotation] : []),
  })
}

function optimisticLike(userId: number, userName: string): AnnotationLike {
  return { _id: `optimistic:${userId}`, userId, userName, timeStamp: new Date() }
}

export function useSetAnnotationLiked(annotationId: string, userId: number, userName: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (liked: boolean) => {
      const result = await setAnnotationLiked(annotationId, liked)
      if (!result.annotation) throw new Error(String(result.message))
      return result.annotation
    },
    onMutate: async liked => {
      await client.cancelQueries({ queryKey: annotationKey(annotationId) })
      const previous = client.getQueryData<Annotation>(annotationKey(annotationId))
      client.setQueryData<Annotation>(annotationKey(annotationId), current => current && ({
        ...current,
        likes: liked
          ? [...current.likes.filter(like => like.userId !== userId), optimisticLike(userId, userName)]
          : current.likes.filter(like => like.userId !== userId),
      }))
      return { previous }
    },
    onError: (_error, _liked, context) => client.setQueryData(annotationKey(annotationId), context?.previous),
    onSuccess: annotation => client.setQueryData(annotationKey(annotationId), annotation),
  })
}

export function useSetCommentLiked(annotationId: string, commentId: string, userId: number, userName: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (liked: boolean) => {
      const result = await setCommentLiked(annotationId, commentId, liked)
      if (!result.annotation) throw new Error(String(result.message))
      return result.annotation
    },
    onMutate: async liked => {
      await client.cancelQueries({ queryKey: annotationKey(annotationId) })
      const previous = client.getQueryData<Annotation>(annotationKey(annotationId))
      client.setQueryData<Annotation>(annotationKey(annotationId), current => current && ({
        ...current,
        comments: current.comments.map(comment => comment._id.toString() !== commentId ? comment : ({
          ...comment,
          likes: liked
            ? [...(comment.likes ?? []).filter(like => like.userId !== userId), optimisticLike(userId, userName)]
            : (comment.likes ?? []).filter(like => like.userId !== userId),
        })),
      }))
      return { previous }
    },
    onError: (_error, _liked, context) => client.setQueryData(annotationKey(annotationId), context?.previous),
    onSuccess: annotation => client.setQueryData(annotationKey(annotationId), annotation),
  })
}

export function useAddComment(annotationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      const result = await addCommentToAnnotation(content, annotationId, parentCommentId)
      if (!result.annotation) throw new Error(String(result.message))
      return { annotation: result.annotation, newComment: result.newComment }
    },
    onSuccess: result => client.setQueryData(annotationKey(annotationId), result.annotation),
  })
}

export function appendComment(annotation: Annotation, comment: AnnotationComment) {
  if (annotation.comments.some(item => item._id.toString() === comment._id.toString())) return annotation
  return { ...annotation, comments: [...annotation.comments, comment] }
}
