import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFamilyEmailConfiguration } from './email-configuration.ts'

const validUserIds = new Set([1, 2])

test('normalizes and groups configured family emails', () => {
  const result = parseFamilyEmailConfiguration(
    JSON.stringify({ 1: [' First@Example.com ', 'first@example.com'], 2: [] }),
    validUserIds,
  )

  assert.deepEqual(result.byUserId.get(1), ['first@example.com'])
  assert.deepEqual(result.byUserId.get(2), [])
  assert.equal(result.byEmail.get('first@example.com'), 1)
})

test('rejects duplicate emails assigned to different family IDs', () => {
  assert.throws(
    () => parseFamilyEmailConfiguration(
      JSON.stringify({ 1: ['same@example.com'], 2: ['same@example.com'] }),
      validUserIds,
    ),
    /IDs 1 and 2/,
  )
})

test('rejects malformed JSON, unknown IDs, scalar values, and invalid emails', () => {
  assert.throws(() => parseFamilyEmailConfiguration('{', validUserIds), /valid JSON/)
  assert.throws(() => parseFamilyEmailConfiguration(JSON.stringify({ 3: [] }), validUserIds), /unknown/)
  assert.throws(() => parseFamilyEmailConfiguration(JSON.stringify({ 1: 'one@example.com' }), validUserIds), /array/)
  assert.throws(() => parseFamilyEmailConfiguration(JSON.stringify({ 1: ['not-an-email'] }), validUserIds), /invalid/)
})
