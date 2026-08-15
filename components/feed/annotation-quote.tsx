import { QuoteIcon } from 'lucide-react'
import type { Annotation, HighlightColor } from '@/types/scripture'
import { getAnnotationQuote } from '@/lib/annotations/presentation'
import { cn } from '@/lib/utils'
import { ScriptureAttributionByline } from '@/components/scripture-people/scripture-attribution-byline'

type AnnotationQuoteProps = {
  annotation: Annotation
  variant: 'feed' | 'solo' | 'panel'
  className?: string
}

const highlightClass = (color: HighlightColor) => ({
  yellow: 'bg-yellow-300 dark:bg-yellow-800',
  blue: 'bg-blue-300 dark:bg-blue-800',
  green: 'bg-green-300 dark:bg-green-800',
  purple: 'bg-purple-300 dark:bg-purple-800',
  pink: 'bg-pink-300 dark:bg-pink-800',
})[color]

export function AnnotationQuote({ annotation, variant, className }: AnnotationQuoteProps) {
  const quote = getAnnotationQuote(annotation)
  if (!quote) return null

  const compact = variant === 'panel'
  const showQuoteIcon = variant !== 'panel'

  return (
    <blockquote
      className={cn(
        'rounded-md border bg-muted/30',
        compact ? 'p-2.5' : 'p-4',
        className,
      )}
      data-testid={variant === 'feed' ? 'feed-annotation-quote' : `annotation-quote-${variant}`}
    >
      <div className={cn('flex', compact ? 'gap-2' : 'gap-3')}>
        {showQuoteIcon && <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className={cn(
            highlightClass(annotation.color),
            'whitespace-pre-line rounded px-1.5 py-1 font-medium leading-relaxed',
            compact ? 'text-sm' : 'text-sm',
          )}>
            {quote}
          </p>
          <ScriptureAttributionByline
            attribution={annotation.scriptureAttribution}
            size={compact ? 'compact' : 'default'}
            className="mt-3 border-t border-border/70 pt-3"
          />
        </div>
      </div>
    </blockquote>
  )
}
