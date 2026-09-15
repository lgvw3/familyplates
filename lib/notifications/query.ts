export const notificationsRootKey = ['notifications'] as const
export const notificationCountKey = [...notificationsRootKey, 'unread-count'] as const
export const notificationListKey = [...notificationsRootKey, 'list'] as const

export function formatNotificationBadge(count: number) {
  if (count <= 0) return null
  return count >= 10 ? '10+' : String(count)
}

export function formatNotificationExcerpt(excerpt: string) {
  return excerpt.length > 140 ? `${excerpt.slice(0, 140)}...` : excerpt
}
