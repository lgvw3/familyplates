import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidEmail, normalizeEmail } from './member-values.ts'

test('normalizes member email addresses', () => {
  assert.equal(normalizeEmail(' First@Example.com '), 'first@example.com')
})

test('validates normalized member email addresses', () => {
  assert.equal(isValidEmail('member@example.com'), true)
  assert.equal(isValidEmail('not-an-email'), false)
})
