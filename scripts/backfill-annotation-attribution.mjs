import { MongoClient } from 'mongodb'
import { resolveScriptureAttribution } from '../lib/scripture-attribution/resolver.ts'
import { shouldBackfillScriptureAttribution } from '../lib/scripture-attribution/backfill.ts'

const apply = process.argv.includes('--apply')
const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='))
const limit = limitArgument ? Number(limitArgument.slice('--limit='.length)) : undefined

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error('--limit must be a positive integer')

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

try {
  const collection = client.db('main').collection('annotations')
  const cursor = collection.find({ target: { $ne: null } }, { ...(limit ? { limit } : {}) })
  const updates = []
  const failures = []
  let scanned = 0

  for await (const document of cursor) {
    scanned += 1
    try {
      const next = resolveScriptureAttribution(document.target)
      if (shouldBackfillScriptureAttribution(document.scriptureAttribution, next)) {
        updates.push({ updateOne: { filter: { _id: document._id }, update: { $set: { scriptureAttribution: next } } } })
      }
    } catch (error) {
      failures.push({ id: document._id.toString(), message: error instanceof Error ? error.message : String(error) })
    }
  }

  console.log({
    mode: apply ? 'apply' : 'dry-run',
    scanned,
    updatesNeeded: updates.length,
    failures: failures.length,
  })
  if (failures.length) {
    console.warn({
      skippedInvalidTargets: failures.length,
      failureSamples: failures.slice(0, 20),
    })
  }

  if (apply && updates.length) {
    const result = await collection.bulkWrite(updates, { ordered: true })
    console.log({ matched: result.matchedCount, modified: result.modifiedCount })
  }
  if (apply) {
    await Promise.all([
      collection.createIndex({ 'scriptureAttribution.primaryProfileId': 1, createdAt: -1 }, { name: 'scripture_attribution_primary_recent' }),
      collection.createIndex({ 'scriptureAttribution.secondaryProfileId': 1, createdAt: -1 }, { name: 'scripture_attribution_secondary_recent' }),
    ])
  }
} finally {
  await client.close()
}
