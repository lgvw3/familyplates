const NAMESPACE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

type Environment = Record<string, string | undefined>

export function requireRealtimeNamespace(environment: Environment = process.env) {
  const value = environment.REALTIME_NAMESPACE?.trim()
  if (!value || !NAMESPACE_PATTERN.test(value)) {
    throw new Error('REALTIME_NAMESPACE is required and must contain only letters, numbers, underscores, or hyphens')
  }
  return value
}

export function realtimeChannel(channel: string, environment: Environment = process.env) {
  return `${requireRealtimeNamespace(environment)}:${channel}`
}

export function realtimePresenceKey(userId: number, environment: Environment = process.env) {
  return `online:${requireRealtimeNamespace(environment)}:${userId}`
}
