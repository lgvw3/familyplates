import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { realtimeChannel, realtimePresenceKey, requireRealtimeNamespace } from './realtime/environment.ts'

test('MongoDB module rejects a missing or invalid database name', () => {
  for (const databaseName of [undefined, 'bad name']) {
    const environment: NodeJS.ProcessEnv = { ...process.env, MONGODB_URI: 'mongodb://localhost:27017' }
    if (databaseName === undefined) delete environment.MONGODB_DATABASE
    else environment.MONGODB_DATABASE = databaseName
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '--eval', "await import('./lib/mongodb.ts')"],
      { cwd: process.cwd(), encoding: 'utf8', env: environment },
    )
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /MONGODB_DATABASE/)
  }
})

test('realtime namespace is required and prefixes channels and presence', () => {
  const environment = { REALTIME_NAMESPACE: 'dev' }
  assert.equal(requireRealtimeNamespace(environment), 'dev')
  assert.equal(realtimeChannel('comments', environment), 'dev:comments')
  assert.equal(realtimePresenceKey(8, environment), 'online:dev:8')
  assert.throws(() => requireRealtimeNamespace({}), /REALTIME_NAMESPACE/)
})
