import 'server-only'

import { mongodbAdapter } from '@better-auth/mongo-adapter'
import { betterAuth } from 'better-auth'
import { mongoClient } from '@/lib/mongodb'
import { findFamilyMemberByEmail, linkAuthUserToFamilyMember } from './members'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret)

export const auth = betterAuth({
  appName: 'Family Plates',
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.SECRET_KEY,
  database: mongodbAdapter(mongoClient.db('main'), {
    client: mongoClient,
    transaction: false,
  }),
  advanced: {
    database: {
      joins: true,
    },
  },
  socialProviders: isGoogleAuthConfigured
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          prompt: 'select_account',
        },
      }
    : {},
  user: {
    validateUserInfo: async ({ user }) => {
      if (!user.email || !(await findFamilyMemberByEmail(user.email))) {
        return {
          error: 'family_email_not_allowed',
          errorDescription: 'That Google account is not on the Family Plates member list.',
        }
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async user => {
          await linkAuthUserToFamilyMember(user.email, user.id)
        },
      },
    },
  },
})
