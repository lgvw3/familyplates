import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getScripturePersonProfile, type ScripturePersonProfile } from '@/lib/scripture-attribution/catalog'
import { cn } from '@/lib/utils'
import type { ScriptureAttribution } from '@/types/scripture'

type ScriptureAttributionBylineProps = {
  attribution: ScriptureAttribution | null | undefined
  size?: 'default' | 'compact'
  className?: string
}

const relationCopy = {
  'recorded-by': 'as recorded by',
  'quoted-by': 'as quoted by',
  'translated-by': 'as translated by',
} as const

function ProfileAvatar({ profile, size }: { profile: ScripturePersonProfile, size: 'default' | 'compact' }) {
  const dimensions = size === 'compact' ? 'h-6 w-6' : 'h-8 w-8'
  const portraitObjectPosition = (profile as ScripturePersonProfile & {
    portraitObjectPosition?: string
    objectPosition?: string
  }).portraitObjectPosition ?? (profile as ScripturePersonProfile & { objectPosition?: string }).objectPosition

  return (
    <Link
      href={`/scripture-people/${encodeURIComponent(profile.id)}`}
      aria-hidden="true"
      tabIndex={-1}
      className="rounded-full focus-visible:outline-none"
    >
      <Avatar className={cn(dimensions, 'border-2 border-background bg-muted shadow-sm')}>
        <AvatarImage src={profile.portraitPath} alt="" className="object-cover" style={portraitObjectPosition ? { objectPosition: portraitObjectPosition } : undefined} />
        <AvatarFallback>{profile.portraitFallback}</AvatarFallback>
      </Avatar>
    </Link>
  )
}

/**
 * The source identity for a passage. It intentionally belongs inside the
 * quoted scripture so the family member stays the primary annotation author.
 */
export function ScriptureAttributionByline({
  attribution,
  size = 'default',
  className,
}: ScriptureAttributionBylineProps) {
  const primary = getScripturePersonProfile(attribution?.primaryProfileId)
  const secondary = getScripturePersonProfile(attribution?.secondaryProfileId)

  if (!primary) return null

  const distinctSecondary = secondary?.id !== primary.id ? secondary : undefined
  const relation = distinctSecondary
    ? relationCopy[attribution?.relation ?? 'recorded-by']
    : null

  return (
    <div className={cn('flex flex-col items-start gap-1.5 text-xs text-muted-foreground', className)}>
      <div className="flex -space-x-2" aria-hidden="true">
        <ProfileAvatar profile={primary} size={size} />
        {distinctSecondary && <ProfileAvatar profile={distinctSecondary} size={size} />}
      </div>
      <p className="leading-snug">
        <Link
          href={`/scripture-people/${encodeURIComponent(primary.id)}`}
          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {primary.name}
        </Link>
        {distinctSecondary && relation && (
          <>
            {' '}{relation}{' '}
            <Link
              href={`/scripture-people/${encodeURIComponent(distinctSecondary.id)}`}
              className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {distinctSecondary.name}
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
