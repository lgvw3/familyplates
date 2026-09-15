import assert from 'node:assert/strict'
import test from 'node:test'
import type { Annotation, AnnotationComment, AnnotationLike } from '../../types/scripture.ts'
import {
  buildAnnotationLikeNotifications,
  buildCommentLikeNotifications,
  buildCommentNotifications,
} from './builders.ts'
import { formatNotificationBadge, formatNotificationExcerpt } from './query.ts'

const annotationId = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const parentId = 'bbbbbbbbbbbbbbbbbbbbbbbb'
const commentId = 'cccccccccccccccccccccccc'

function comment(overrides: Partial<AnnotationComment> = {}): AnnotationComment {
  return {
    _id: commentId,
    userId: 3,
    userName: 'Commenter',
    timeStamp: new Date('2026-01-02T00:00:00Z'),
    content: 'A thoughtful reply',
    likes: [],
    ...overrides,
  }
}

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    _id: annotationId,
    schemaVersion: 2,
    target: null,
    text: 'An annotation',
    type: 'note',
    color: 'yellow',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    userId: 1,
    userName: 'Author',
    comments: [],
    likes: [],
    ...overrides,
  }
}

function like(overrides: Partial<AnnotationLike> = {}): AnnotationLike {
  return {
    _id: 'dddddddddddddddddddddddd',
    userId: 3,
    userName: 'Liker',
    timeStamp: new Date('2026-01-03T00:00:00Z'),
    ...overrides,
  }
}

test('reply notifies annotation and parent-comment owners', () => {
  const parent = comment({ _id: parentId, userId: 2, userName: 'Parent', parentCommentId: undefined })
  const reply = comment({ parentCommentId: parentId })
  const result = buildCommentNotifications(annotation({ comments: [parent] }), reply)
  assert.deepEqual(result.map(item => [item.recipientUserId, item.kind]), [[1, 'comment'], [2, 'reply']])
})

test('reply deduplicates a shared owner and prefers the reply label', () => {
  const parent = comment({ _id: parentId, userId: 1, userName: 'Author', parentCommentId: undefined })
  const reply = comment({ parentCommentId: parentId })
  const result = buildCommentNotifications(annotation({ comments: [parent] }), reply)
  assert.deepEqual(result.map(item => [item.recipientUserId, item.kind]), [[1, 'reply']])
})

test('comment and like builders exclude the actor from self notifications', () => {
  assert.equal(buildCommentNotifications(annotation({ userId: 3 }), comment()).length, 0)
  assert.equal(buildAnnotationLikeNotifications(annotation({ userId: 3 }), like()).length, 0)
  assert.equal(buildCommentLikeNotifications(annotation(), comment({ userId: 3 }), like()).length, 0)
})

test('like builders create stable personal targets', () => {
  const annotationResult = buildAnnotationLikeNotifications(annotation(), like())[0]
  assert.equal(annotationResult.eventKey, 'annotation-like:dddddddddddddddddddddddd')
  assert.equal(annotationResult.recipientUserId, 1)
  assert.equal(annotationResult.targetPath, `/annotation/${annotationId}`)

  const targetComment = comment({ userId: 2 })
  const commentResult = buildCommentLikeNotifications(annotation(), targetComment, like())[0]
  assert.equal(commentResult.eventKey, 'comment-like:dddddddddddddddddddddddd')
  assert.equal(commentResult.recipientUserId, 2)
  assert.match(commentResult.targetPath, new RegExp(`comment=${commentId}`))
})

test('badge formatter caps ten and above', () => {
  assert.equal(formatNotificationBadge(0), null)
  assert.equal(formatNotificationBadge(1), '1')
  assert.equal(formatNotificationBadge(9), '9')
  assert.equal(formatNotificationBadge(10), '10+')
  assert.equal(formatNotificationBadge(42), '10+')
})

test('excerpt formatter adds an ellipsis only when truncating', () => {
  assert.equal(formatNotificationExcerpt('Short notification'), 'Short notification')
  assert.equal(formatNotificationExcerpt('a'.repeat(140)), 'a'.repeat(140))
  assert.equal(formatNotificationExcerpt('a'.repeat(141)), `${'a'.repeat(140)}...`)
})
