export type FamilyEmailConfiguration = {
  byEmail: Map<string, number>
  byUserId: Map<number, string[]>
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function parseFamilyEmailConfiguration(
  raw: string | undefined,
  validUserIds: ReadonlySet<number>,
): FamilyEmailConfiguration {
  if (!raw) return { byEmail: new Map(), byUserId: new Map() }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('FAMILY_MEMBER_EMAILS_JSON must contain valid JSON')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FAMILY_MEMBER_EMAILS_JSON must be an object keyed by family member ID')
  }

  const byEmail = new Map<string, number>()
  const byUserId = new Map<number, string[]>()
  for (const [userIdValue, configuredValue] of Object.entries(parsed)) {
    const userId = Number(userIdValue)
    if (!Number.isInteger(userId) || !validUserIds.has(userId)) {
      throw new Error(`FAMILY_MEMBER_EMAILS_JSON contains unknown family member ID ${userIdValue}`)
    }
    if (!Array.isArray(configuredValue)) {
      throw new Error(`Family member ID ${userId} must map to an array of email addresses`)
    }

    const emails = [...new Set(configuredValue.map(value => {
      if (typeof value !== 'string') {
        throw new Error(`Family member ID ${userId} contains a non-string email value`)
      }
      const email = normalizeEmail(value)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`Family member ID ${userId} contains an invalid email address`)
      }
      return email
    }))]

    for (const email of emails) {
      const existingUserId = byEmail.get(email)
      if (existingUserId && existingUserId !== userId) {
        throw new Error(`The same email is configured for family member IDs ${existingUserId} and ${userId}`)
      }
      byEmail.set(email, userId)
    }
    byUserId.set(userId, emails)
  }

  return { byEmail, byUserId }
}
