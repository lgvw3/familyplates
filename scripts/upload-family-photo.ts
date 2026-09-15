import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { MongoClient } from 'mongodb'

const MAX_AVATAR_BYTES = 500_000
const MIME_TYPES: Record<string, string> = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function usage(message?: string, exitCode = 1): never {
  if (message) console.error(`Error: ${message}\n`)
  console.error('Usage: npm run upload:family-photo -- --member <name-or-id> --photo <path>')
  console.error('   or: npm run upload:family-photo -- "Member Name" ./photo.jpg')
  console.error(`Supported formats: ${Object.keys(MIME_TYPES).join(', ')} (maximum ${MAX_AVATAR_BYTES} bytes)`)
  process.exit(exitCode)
}

function parseArguments(argv: string[]) {
  const positional: string[] = []
  let member: string | undefined
  let photo: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') usage(undefined, 0)
    if (argument === '--member' || argument === '-m') {
      member = argv[++index]
      continue
    }
    if (argument === '--photo' || argument === '-p') {
      photo = argv[++index]
      continue
    }
    if (argument.startsWith('-')) usage(`Unknown option: ${argument}`)
    positional.push(argument)
  }

  member ??= positional[0]
  photo ??= positional[1]
  if (!member || !photo) usage('A member and photo path are required.')
  return { member: member.trim(), photo: resolve(photo) }
}

const { member: memberInput, photo: photoPath } = parseArguments(process.argv.slice(2))
const extension = extname(photoPath).toLowerCase()
const mimeType = MIME_TYPES[extension]
if (!mimeType) usage(`Unsupported photo format "${extension || 'unknown'}".`)

let photo: Buffer
try {
  photo = await readFile(photoPath)
} catch {
  usage(`Could not read photo file: ${photoPath}`)
}
if (photo.length === 0) usage('The photo file is empty.')
if (photo.length > MAX_AVATAR_BYTES) {
  usage(`The photo is ${photo.length} bytes; resize or compress it below ${MAX_AVATAR_BYTES} bytes.`)
}

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

const client = new MongoClient(process.env.MONGODB_URI)
try {
  await client.connect()
  const members = client.db('main').collection<{ userId: number; name: string }>('familyMembers')
  const account = /^\d+$/.test(memberInput)
    ? await members.findOne({ userId: Number(memberInput) })
    : await members.findOne({ name: memberInput }, { collation: { locale: 'en', strength: 2 } })
  if (!account) {
    const availableMembers = await members.find({}, { projection: { userId: 1, name: 1 } })
      .sort({ userId: 1 })
      .toArray()
    usage(`No family member matched "${memberInput}". Available members:\n${availableMembers.map(member => `${member.userId}: ${member.name}`).join('\n')}`)
  }

  await client.db('main').collection('userProfiles').updateOne(
    { userId: account.userId },
    {
      $set: {
        userId: account.userId,
        avatar: `data:${mimeType};base64,${photo.toString('base64')}`,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  )
  console.log(`Uploaded ${photoPath} as the profile photo for ${account.name} (user ${account.userId}).`)
} finally {
  await client.close()
}
