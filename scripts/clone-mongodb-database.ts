import type { CollectionInfo, CreateCollectionOptions, IndexDescription } from 'mongodb'
import clientPromise, { mongoClient, mongoDatabaseName } from '../lib/mongodb.ts'

const EXCLUDED_COLLECTIONS = new Set(['notificationSubscriptions'])
const NAME_PATTERN = /^[A-Za-z0-9_-]{1,63}$/

function optionValue(name: string) {
  const prefix = `--${name}=`
  return process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
}

const apply = process.argv.includes('--apply')
const replace = process.argv.includes('--replace')
const sourceName = optionValue('source') ?? 'main'
const targetName = optionValue('target') ?? mongoDatabaseName

if (!NAME_PATTERN.test(sourceName) || !NAME_PATTERN.test(targetName)) throw new Error('Source and target database names are invalid')
if (sourceName === targetName) throw new Error('Source and target databases must be different')
if (targetName === 'main') throw new Error('The clone command will never write to or replace the main database')
if (replace && !apply) throw new Error('--replace requires --apply')

const client = await clientPromise

try {
  const source = client.db(sourceName)
  const target = client.db(targetName)
  const sourceCollections = (await source.listCollections().toArray() as CollectionInfo[])
    .filter(collection => !EXCLUDED_COLLECTIONS.has(collection.name))
  const existingTargetCollections = await target.listCollections({}, { nameOnly: true }).toArray()

  const summary = await Promise.all(sourceCollections.map(async collection => ({
    name: collection.name,
    type: collection.type,
    documents: collection.type === 'view' ? null : await source.collection(collection.name).countDocuments(),
  })))
  console.log({
    mode: apply ? (replace ? 'replace' : 'apply') : 'dry-run',
    source: sourceName,
    target: targetName,
    excludedCollections: [...EXCLUDED_COLLECTIONS],
    collections: summary,
  })

  if (existingTargetCollections.length && !replace) {
    throw new Error(`Target database ${targetName} is not empty; rerun with --apply --replace to recreate it`)
  }
  if (!apply) process.exitCode = 0
  else {
    if (replace) await target.dropDatabase()

    const physicalCollections = sourceCollections.filter(collection => collection.type !== 'view')
    const views = sourceCollections.filter(collection => collection.type === 'view')

    for (const info of physicalCollections) {
      await target.createCollection(info.name, info.options as CreateCollectionOptions)
      const sourceCollection = source.collection(info.name)
      const targetCollection = target.collection(info.name)
      let batch: Record<string, unknown>[] = []
      for await (const document of sourceCollection.find({})) {
        batch.push(document)
        if (batch.length === 500) {
          await targetCollection.insertMany(batch, { ordered: true })
          batch = []
        }
      }
      if (batch.length) await targetCollection.insertMany(batch, { ordered: true })

      const indexes = (await sourceCollection.listIndexes().toArray())
        .filter(index => index.name !== '_id_')
        .map(index => Object.fromEntries(
          Object.entries(index).filter(([key]) => key !== 'v' && key !== 'ns'),
        ) as unknown as IndexDescription)
      if (indexes.length) await targetCollection.createIndexes(indexes)
    }

    for (const info of views) {
      await target.createCollection(info.name, info.options as CreateCollectionOptions)
    }

    for (const info of physicalCollections) {
      const sourceCollection = source.collection(info.name)
      const targetCollection = target.collection(info.name)
      const [sourceCount, targetCount, sourceIndexes, targetIndexes] = await Promise.all([
        sourceCollection.countDocuments(),
        targetCollection.countDocuments(),
        sourceCollection.listIndexes().toArray(),
        targetCollection.listIndexes().toArray(),
      ])
      if (sourceCount !== targetCount) throw new Error(`Document count mismatch for ${info.name}`)
      const sourceIndexNames = sourceIndexes.map(index => index.name).sort()
      const targetIndexNames = targetIndexes.map(index => index.name).sort()
      if (JSON.stringify(sourceIndexNames) !== JSON.stringify(targetIndexNames)) {
        throw new Error(`Index mismatch for ${info.name}`)
      }
    }

    console.log({ copiedDatabase: targetName, verifiedCollections: physicalCollections.length, copiedViews: views.length })
  }
} finally {
  await mongoClient.close()
}
