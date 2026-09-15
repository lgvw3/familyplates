import { MongoClient } from 'mongodb'
import { accounts } from '../lib/auth/accounts.ts'
import { parseFamilyEmailConfiguration } from '../lib/auth/email-configuration.ts'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

const emailConfiguration = parseFamilyEmailConfiguration(
  process.env.FAMILY_MEMBER_EMAILS_JSON,
  new Set(accounts.map(account => account.id)),
)
const client = new MongoClient(process.env.MONGODB_URI)

try {
  await client.connect()
  const collection = client.db('main').collection('familyMembers')
  const now = new Date()

  await collection.bulkWrite(accounts.map(account => ({
      updateOne: {
        filter: { userId: account.id },
        update: {
          $set: {
            name: account.name,
            updatedAt: now,
            normalizedEmails: [],
          },
          $setOnInsert: {
            userId: account.id,
            enabled: true,
            createdAt: now,
          },
        },
        upsert: true,
      },
    })))

  await collection.bulkWrite(accounts.map(account => ({
    updateOne: {
      filter: { userId: account.id },
      update: { $set: { normalizedEmails: emailConfiguration.byUserId.get(account.id) ?? [], updatedAt: now } },
    },
  })))

  await collection.createIndex({ userId: 1 }, { unique: true })
  await collection.createIndex({ normalizedEmails: 1 }, { unique: true, sparse: true })
  console.log(`Seeded ${accounts.length} family member records; ${emailConfiguration.byUserId.size} have configured email entries.`)
} finally {
  await client.close()
}
