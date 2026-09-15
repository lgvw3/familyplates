import { MongoClient, type UpdateFilter } from 'mongodb'
import { isValidEmail, normalizeEmail } from '../lib/auth/member-values.ts'
import type { FamilyMemberRecord } from '../lib/auth/definitions.ts'

type Arguments = {
  userId?: number
  name?: string
  addEmails: string[]
  removeEmails: string[]
  enabled?: boolean
  unlinkAuth: boolean
}

function usage(message?: string, exitCode = 1): never {
  if (message) console.error(`Error: ${message}\n`)
  console.error('Usage: npm run manage:family-member -- --id <number> [options]')
  console.error('Options:')
  console.error('  --name <name>          Set the member display name (required for a new member)')
  console.error('  --email <email>        Add an allowed login email; may be repeated')
  console.error('  --remove-email <email> Remove an allowed login email; may be repeated')
  console.error('  --enable | --disable   Allow or deny sign-in')
  console.error('  --unlink-auth          Clear the Better Auth user link so a new login can claim it')
  process.exit(exitCode)
}

function nextValue(argv: string[], index: number, option: string) {
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) usage(`${option} requires a value`)
  return value
}

function parseArguments(argv: string[]): Arguments {
  const result: Arguments = { addEmails: [], removeEmails: [], unlinkAuth: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') usage(undefined, 0)
    if (argument === '--id') {
      result.userId = Number(nextValue(argv, index, argument))
      index += 1
      continue
    }
    if (argument === '--name') {
      result.name = nextValue(argv, index, argument).trim()
      index += 1
      continue
    }
    if (argument === '--email' || argument === '--remove-email') {
      const email = normalizeEmail(nextValue(argv, index, argument))
      if (!isValidEmail(email)) usage(`${argument} contains an invalid email address`)
      const target = argument === '--email' ? result.addEmails : result.removeEmails
      target.push(email)
      index += 1
      continue
    }
    if (argument === '--enable' || argument === '--disable') {
      const enabled = argument === '--enable'
      if (result.enabled !== undefined && result.enabled !== enabled) usage('Choose either --enable or --disable')
      result.enabled = enabled
      continue
    }
    if (argument === '--unlink-auth') {
      result.unlinkAuth = true
      continue
    }
    usage(`Unknown option: ${argument}`)
  }

  if (!Number.isSafeInteger(result.userId) || result.userId! <= 0) usage('--id must be a positive integer')
  if (result.name !== undefined && !result.name) usage('--name cannot be empty')
  if (result.addEmails.length && result.removeEmails.length) {
    usage('Add and remove emails in separate commands')
  }
  if (result.name === undefined && result.enabled === undefined && !result.addEmails.length &&
      !result.removeEmails.length && !result.unlinkAuth) {
    usage('Provide at least one change')
  }

  result.addEmails = [...new Set(result.addEmails)]
  result.removeEmails = [...new Set(result.removeEmails)]
  return result
}

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

const args = parseArguments(process.argv.slice(2))
const client = new MongoClient(process.env.MONGODB_URI)

try {
  await client.connect()
  const collection = client.db('main').collection<FamilyMemberRecord>('familyMembers')
  await collection.createIndex({ userId: 1 }, { unique: true })
  await collection.createIndex({ normalizedEmails: 1 }, { unique: true, sparse: true })
  await collection.createIndex(
    { authUserId: 1 },
    { unique: true, partialFilterExpression: { authUserId: { $type: 'string' } } },
  )

  const existing = await collection.findOne({ userId: args.userId })
  if (!existing && !args.name) usage('--name is required when creating a member')

  const now = new Date()
  const update: UpdateFilter<FamilyMemberRecord> = {
    $set: {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      ...(args.unlinkAuth ? { authUserId: null } : {}),
      updatedAt: now,
    },
    $setOnInsert: {
      userId: args.userId!,
      ...(args.enabled === undefined ? { enabled: true } : {}),
      createdAt: now,
      ...(!args.addEmails.length ? { normalizedEmails: [] } : {}),
    },
    ...(args.addEmails.length ? { $addToSet: { normalizedEmails: { $each: args.addEmails } } } : {}),
    ...(args.removeEmails.length ? { $pull: { normalizedEmails: { $in: args.removeEmails } } } : {}),
  }

  await collection.updateOne({ userId: args.userId }, update, { upsert: true })
  const member = await collection.findOne(
    { userId: args.userId },
    { projection: { _id: 0, userId: 1, name: 1, normalizedEmails: 1, authUserId: 1, enabled: 1 } },
  )
  console.log(JSON.stringify({
    ...member,
    authUserId: member?.authUserId ? '[linked]' : null,
  }, null, 2))
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 11000) {
    throw new Error('That user ID, email, or Better Auth link already belongs to another family member')
  }
  throw error
} finally {
  await client.close()
}
