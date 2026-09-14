import assert from 'node:assert/strict'
import test from 'node:test'
import type { AnnotationTarget } from '../../types/scripture.ts'
import {
  annotationTargetKey,
  annotationUpdatesChannel,
  parseAnnotationUpdate,
  serializeAnnotationUpdate,
} from './realtime.ts'

const scriptureTarget: AnnotationTarget = {
  kind: 'scripture',
  sourceVersion: 'book-of-mormon-local-v1',
  bookId: 'the-book-of-mormon',
  chapterNumber: 1,
  start: { unit: 1, offset: 0 },
  end: { unit: 1, offset: 4 },
  quote: { exact: 'A passage' },
}

test('annotation update protocol serializes invalidation metadata without a snapshot', () => {
  const serialized = serializeAnnotationUpdate({ annotationId: 'annotation-1', target: scriptureTarget })
  assert.deepEqual(JSON.parse(serialized), {
    annotationId: 'annotation-1',
    target: scriptureTarget,
  })
  assert.equal(serialized.includes('text'), false)
  assert.equal(annotationUpdatesChannel, 'annotationUpdates')
})

test('annotation update protocol maps target metadata to the collection key', () => {
  const event = parseAnnotationUpdate(JSON.stringify({ annotationId: 'annotation-1', target: scriptureTarget }))
  assert.deepEqual(event, { annotationId: 'annotation-1', target: scriptureTarget })
  assert.equal(annotationTargetKey(event?.target ?? null), 'scripture:the-book-of-mormon:1')
  assert.equal(annotationTargetKey(null), null)
  assert.equal(parseAnnotationUpdate('{bad json'), null)
  assert.equal(parseAnnotationUpdate(JSON.stringify({ target: scriptureTarget })), null)
})
