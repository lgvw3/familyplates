import fs from 'node:fs'
import path from 'node:path'
import { MongoClient } from 'mongodb'

const apply = process.argv.includes('--apply')
const sourceCollectionName = 'annotations_new'
const destinationCollectionName = 'annotations'
const stagingCollectionName = 'annotations_v2_staging'
const sourceVersion = 'book-of-mormon-local-v1'
const root = process.cwd()

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalizeWithMap(text) {
  let normalized = ''
  const map = []
  let previousWasWhitespace = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index] === '\u00a0' ? ' ' : text[index]
    if (/\s/.test(char)) {
      if (!previousWasWhitespace) {
        normalized += ' '
        map.push(index)
      }
      previousWasWhitespace = true
    } else {
      normalized += char
      map.push(index)
      previousWasWhitespace = false
    }
  }

  return { normalized, map }
}

function allOccurrences(text, needle) {
  if (!needle) return []
  const occurrences = []
  let from = 0
  while (from <= text.length - needle.length) {
    const index = text.indexOf(needle, from)
    if (index < 0) break
    occurrences.push({ start: index, end: index + needle.length })
    from = index + 1
  }
  return occurrences
}

function buildResource(document) {
  if (document.chapterNumber === 0 && document.bookId) {
    const filePath = path.join(root, 'lib', 'scripture_data', 'intro_material', `${document.bookId}.json`)
    if (!fs.existsSync(filePath)) throw new Error(`Missing intro source ${document.bookId}`)
    const intro = readJson(filePath)
    const units = intro.paragraphs.map((text, unit) => ({ unit, text, label: '' }))
    return buildUnitResource('intro', units)
  }

  const filePath = path.join(
    root,
    'lib',
    'scripture_data',
    'chapters',
    document.bookId,
    `chapter_${document.chapterNumber}.json`,
  )
  if (!fs.existsSync(filePath)) throw new Error(`Missing chapter source ${document.bookId} ${document.chapterNumber}`)
  const chapter = readJson(filePath)
  const units = chapter.verses.map((verse) => ({
    unit: verse.number,
    text: verse.text,
    label: `${verse.number} `,
  }))
  return buildUnitResource('scripture', units)
}

function buildUnitResource(kind, units) {
  let cursor = 0
  const spans = units.map((unit, index) => {
    const legacyStart = cursor
    const textStart = legacyStart + unit.label.length
    const textEnd = textStart + unit.text.length
    cursor = textEnd + (index < units.length - 1 ? 2 : 0)
    return { ...unit, legacyStart, textStart, textEnd }
  })
  const legacyText = spans.map((unit) => `${unit.label}${unit.text}`).join('\n\n')
  return { kind, units: spans, legacyText }
}

function quoteCandidates(resource, quote) {
  const direct = allOccurrences(resource.legacyText.replaceAll('\u00a0', ' '), quote.replaceAll('\u00a0', ' '))
  if (direct.length) return direct

  const source = normalizeWithMap(resource.legacyText)
  const wanted = normalizeWithMap(quote).normalized
  return allOccurrences(source.normalized, wanted).map(({ start, end }) => ({
    start: source.map[start],
    end: source.map[end - 1] + 1,
  }))
}

function absoluteToPoint(resource, absolute, edge) {
  for (let index = 0; index < resource.units.length; index++) {
    const unit = resource.units[index]
    if (absolute >= unit.textStart && absolute <= unit.textEnd) {
      return { unit: unit.unit, offset: absolute - unit.textStart }
    }
    if (absolute < unit.textStart) {
      if (edge === 'start' || index === 0) return { unit: unit.unit, offset: 0 }
      const previous = resource.units[index - 1]
      return { unit: previous.unit, offset: previous.text.length }
    }
  }

  const last = resource.units.at(-1)
  if (!last) throw new Error('Resource has no text units')
  return { unit: last.unit, offset: last.text.length }
}

function quoteFromPoints(resource, start, end) {
  return resource.units
    .filter((unit) => unit.unit >= start.unit && unit.unit <= end.unit)
    .map((unit) => unit.text.slice(
      unit.unit === start.unit ? start.offset : 0,
      unit.unit === end.unit ? end.offset : unit.text.length,
    ))
    .join('\n\n')
}

function chooseRange(document, resource) {
  const stored = {
    start: Number(document.startIndex),
    end: Number(document.endIndex),
  }
  const quote = document.highlightedText ?? ''
  const storedSlice = resource.legacyText.slice(stored.start, stored.end)
  const normalizedStored = normalizeWithMap(storedSlice).normalized
  const normalizedQuote = normalizeWithMap(quote).normalized

  if (normalizedQuote && normalizedStored === normalizedQuote) {
    return { ...stored, recovery: 'stored-offsets' }
  }

  let candidates = quoteCandidates(resource, quote)
  if (Array.isArray(document.verseNumbers) && document.verseNumbers.length && resource.kind === 'scripture') {
    const allowed = new Set(document.verseNumbers)
    const constrained = candidates.filter((candidate) => {
      const start = absoluteToPoint(resource, candidate.start, 'start')
      const end = absoluteToPoint(resource, candidate.end, 'end')
      return allowed.has(start.unit) || allowed.has(end.unit)
    })
    if (constrained.length) candidates = constrained
  }

  if (!candidates.length) throw new Error('Highlighted quote was not found in its source text')
  candidates.sort((a, b) => Math.abs(a.start - stored.start) - Math.abs(b.start - stored.start))
  if (candidates.length > 1) {
    const firstDistance = Math.abs(candidates[0].start - stored.start)
    const secondDistance = Math.abs(candidates[1].start - stored.start)
    if (firstDistance === secondDistance) throw new Error('Highlighted quote has multiple equally likely locations')
  }
  return { ...candidates[0], recovery: candidates.length === 1 ? 'quote-search' : 'nearest-quote' }
}

function migrateDocument(document) {
  const { chapterNumber, bookId, unboundAnnotation } = document
  const rest = { ...document }
  for (const field of [
    'startIndex',
    'endIndex',
    'verseNumbers',
    'chapterNumber',
    'bookId',
    'highlightedText',
    'unboundAnnotation',
  ]) delete rest[field]

  if (unboundAnnotation || !bookId) {
    return {
      document: { ...rest, schemaVersion: 2, target: null },
      recovery: 'unbound',
    }
  }

  const resource = buildResource(document)
  const range = chooseRange(document, resource)
  const start = absoluteToPoint(resource, range.start, 'start')
  const end = absoluteToPoint(resource, range.end, 'end')
  const exact = quoteFromPoints(resource, start, end)
  if (!exact) throw new Error('Converted range is empty')

  const target = resource.kind === 'scripture'
    ? {
        kind: 'scripture',
        sourceVersion,
        bookId,
        chapterNumber,
        start,
        end,
        quote: { exact },
      }
    : {
        kind: 'intro',
        sourceVersion,
        introId: bookId,
        start,
        end,
        quote: { exact },
      }

  return {
    document: { ...rest, schemaVersion: 2, target },
    recovery: range.recovery,
  }
}

function validateMigrated(documents, sourceCount) {
  if (documents.length !== sourceCount) throw new Error('Migrated document count does not match source')
  const ids = new Set(documents.map((document) => document._id.toString()))
  if (ids.size !== sourceCount) throw new Error('Migrated documents contain duplicate IDs')
  for (const document of documents) {
    if (document.schemaVersion !== 2) throw new Error(`Document ${document._id} is not schema v2`)
    if (document.target && !document.target.quote.exact) throw new Error(`Document ${document._id} has an empty quote`)
  }
}

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

try {
  const db = client.db('main')
  const source = db.collection(sourceCollectionName)
  const sourceDocuments = await source.find({}).toArray()
  const migrated = []
  const failures = []
  const recoveryCounts = new Map()

  for (const document of sourceDocuments) {
    try {
      const result = migrateDocument(document)
      migrated.push(result.document)
      recoveryCounts.set(result.recovery, (recoveryCounts.get(result.recovery) ?? 0) + 1)
    } catch (error) {
      failures.push({ id: document._id.toString(), message: error instanceof Error ? error.message : String(error) })
    }
  }

  console.log({
    mode: apply ? 'apply' : 'dry-run',
    source: sourceCollectionName,
    sourceCount: sourceDocuments.length,
    migratedCount: migrated.length,
    failures: failures.length,
    recovery: Object.fromEntries(recoveryCounts),
  })
  if (failures.length) console.log(failures)
  if (failures.length) throw new Error('Migration audit failed; no database writes were made')
  validateMigrated(migrated, sourceDocuments.length)
  if (!apply) process.exitCode = 0
  else {
    const existingCollections = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name))
    if (existingCollections.has(stagingCollectionName)) await db.collection(stagingCollectionName).drop()
    const staging = db.collection(stagingCollectionName)
    if (migrated.length) await staging.insertMany(migrated, { ordered: true })
    await staging.createIndex(
      { 'target.kind': 1, 'target.bookId': 1, 'target.chapterNumber': 1 },
      { name: 'scripture_target' },
    )
    await staging.createIndex(
      { 'target.kind': 1, 'target.introId': 1 },
      { name: 'intro_target' },
    )
    await staging.createIndex({ createdAt: -1 }, { name: 'recent_annotations' })

    const stagedCount = await staging.countDocuments()
    if (stagedCount !== sourceDocuments.length) throw new Error('Staging count verification failed')

    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
    let archivedCollection = null
    if (existingCollections.has(destinationCollectionName)) {
      archivedCollection = `${destinationCollectionName}_pre_v2_${timestamp}`
      await db.collection(destinationCollectionName).rename(archivedCollection)
    }
    await staging.rename(destinationCollectionName)

    console.log({
      promotedCollection: destinationCollectionName,
      promotedCount: await db.collection(destinationCollectionName).countDocuments(),
      archivedCollection,
      rollbackCollection: sourceCollectionName,
    })
  }
} finally {
  await client.close()
}
