import assert from 'node:assert/strict'
import test from 'node:test'
import type { Annotation, AnnotationComment, AnnotationLike } from '../../types/scripture.ts'
import {
  annotationHasLike,
  commentHasLike,
  replaceAnnotationUserLike,
  replaceCommentUserLike,
} from './query-cache.ts'

function like(id: string, userId: number): AnnotationLike {
  return { _id: id, userId, userName: `User ${userId}`, timeStamp: new Date(0) }
}

function comment(id: string, likes: AnnotationLike[] = []): AnnotationComment {
  return { _id: id, userId: 2, userName: 'Commenter', timeStamp: new Date(0), content: id, likes }
}

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    _id: 'annotation-1',
    schemaVersion: 2,
    target: null,
    text: 'Annotation',
    type: 'note',
    color: 'yellow',
    createdAt: new Date(0),
    userId: 1,
    userName: 'Author',
    comments: [],
    likes: [],
    ...overrides,
  }
}

test('annotation like reconciliation changes only the current user', () => {
  const concurrentLike = like('concurrent', 3)
  const optimistic = like('optimistic', 1)
  const persisted = like('persisted', 1)
  const current = annotation({ comments: [comment('live-comment')], likes: [concurrentLike, optimistic] })

  const result = replaceAnnotationUserLike(current, 1, persisted)

  assert.deepEqual(result.comments, current.comments)
  assert.deepEqual(result.likes, [concurrentLike, persisted])
  assert.equal(annotationHasLike(result, 1, 'persisted'), true)
})

test('comment like reconciliation preserves concurrent comments and other users likes', () => {
  const otherLike = like('other-like', 3)
  const optimistic = like('optimistic', 1)
  const persisted = like('persisted', 1)
  const concurrentComment = comment('concurrent-comment')
  const current = annotation({ comments: [comment('target', [otherLike, optimistic]), concurrentComment] })

  const result = replaceCommentUserLike(current, 'target', 1, persisted)

  assert.deepEqual(result.comments[0].likes, [otherLike, persisted])
  assert.equal(result.comments[1], concurrentComment)
  assert.equal(commentHasLike(result, 'target', 1, 'persisted'), true)
})

test('rollback helpers can recognize that a newer like replaced the optimistic state', () => {
  const current = annotation({ likes: [like('newer-websocket-like', 1)] })
  const currentComment = annotation({ comments: [comment('target', [like('newer-websocket-like', 1)])] })

  assert.equal(annotationHasLike(current, 1, 'optimistic'), false)
  assert.equal(commentHasLike(currentComment, 'target', 1, 'optimistic'), false)
})
