import type { UserAccount } from './definitions'

export function usersToMap(users: readonly UserAccount[]) {
  return new Map(users.map(user => [user.id, user]))
}
