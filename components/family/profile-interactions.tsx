import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import type { FamilyInteraction } from '@/lib/auth/definitions'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(new Date(value))
}

export function ProfileInteractions({ interactions }: { interactions: FamilyInteraction[] }) {
  return (
    <div className="divide-y divide-border/70">
      {interactions.map(interaction => {
        const isComment = interaction.kind === 'comment'
        const href = interaction.commentId
          ? `/annotation/${interaction.annotationId}?comment=${interaction.commentId}#comment-${interaction.commentId}`
          : `/annotation/${interaction.annotationId}`
        const label = isComment
          ? `Commented on ${interaction.annotationAuthorName}'s annotation`
          : interaction.kind === 'comment-like'
            ? `Liked ${interaction.commentAuthorName}'s comment`
            : `Liked ${interaction.annotationAuthorName}'s annotation`
        const excerpt = interaction.commentContent ?? interaction.annotationText

        return (
          <Link
            key={interaction.key}
            href={href}
            className="flex gap-3 px-3 py-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {isComment ? <MessageCircle className="size-4" /> : <Heart className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{formatDate(interaction.occurredAt)}</span>
              </span>
              <span className="mt-1 block line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{excerpt}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
