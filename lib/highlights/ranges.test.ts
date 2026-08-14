import assert from 'node:assert/strict'
import test from 'node:test'
import type { Annotation } from '../../types/scripture.ts'
import { getQuoteForRange, segmentTextUnit } from './ranges.ts'

function annotation(id: string, start: number, end: number): Annotation {
  return {
    _id: id,
    schemaVersion: 2,
    target: {
      kind: 'scripture',
      sourceVersion: 'book-of-mormon-local-v1',
      bookId: 'test',
      chapterNumber: 1,
      start: { unit: 1, offset: start },
      end: { unit: 1, offset: end },
      quote: { exact: '' },
    },
    text: '',
    type: 'note',
    color: id === 'a' ? 'yellow' : 'blue',
    createdAt: new Date(0),
    userId: 1,
    userName: 'Test',
    comments: [],
    likes: [],
  }
}

test('segments crossing overlaps without nesting', () => {
  const segments = segmentTextUnit(
    { unit: 1, text: 'abcdefghijklmnop' },
    [annotation('a', 2, 10), annotation('b', 5, 15)],
  )

  assert.deepEqual(
    segments.map((segment) => [segment.start, segment.end, segment.annotations.map((item) => item._id)]),
    [
      [0, 2, []],
      [2, 5, ['a']],
      [5, 10, ['a', 'b']],
      [10, 15, ['b']],
      [15, 16, []],
    ],
  )
})

test('keeps annotations with identical boundaries', () => {
  const segments = segmentTextUnit(
    { unit: 1, text: 'abcdef' },
    [annotation('a', 1, 5), annotation('b', 1, 5)],
  )
  assert.deepEqual(segments[1].annotations.map((item) => item._id), ['a', 'b'])
})

test('extracts a quote across text units', () => {
  assert.equal(
    getQuoteForRange(
      [
        { unit: 1, text: 'first verse' },
        { unit: 2, text: 'second verse' },
      ],
      { unit: 1, offset: 6 },
      { unit: 2, offset: 6 },
    ),
    'verse\n\nsecond',
  )
})
