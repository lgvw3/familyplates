'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type ProfilePortraitTooltipProps = {
  id: string
  name: string
  portraitPath: string
  portraitFallback: string
  portraitObjectPosition?: string
  provenanceLabel: string
  provenanceCredit: string
  provenanceNote?: string
  sourceUrl?: string
}

export function ProfilePortraitTooltip({
  id,
  name,
  portraitPath,
  portraitFallback,
  portraitObjectPosition,
  provenanceLabel,
  provenanceCredit,
  provenanceNote,
  sourceUrl,
}: ProfilePortraitTooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipId = `${id}-portrait-tooltip`

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div ref={containerRef} className="group relative shrink-0">
      <button
        type="button"
        aria-label={`Show portrait details for ${name}`}
        aria-controls={tooltipId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar className="h-24 w-24 border-2 border-background bg-muted shadow-sm">
          <AvatarImage
            src={portraitPath}
            alt={name}
            className="object-cover"
            style={portraitObjectPosition ? { objectPosition: portraitObjectPosition } : undefined}
          />
          <AvatarFallback className="text-2xl">{portraitFallback}</AvatarFallback>
        </Avatar>
      </button>

      <div
        id={tooltipId}
        role="dialog"
        aria-label={`${name} portrait details`}
        className={cn(
          'invisible pointer-events-none absolute left-0 top-full z-20 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-3 text-popover-foreground opacity-0 shadow-lg transition-opacity',
          'group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100',
          open && 'pointer-events-auto visible opacity-100',
        )}
      >
        <div className="flex gap-3">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={portraitPath}
              alt=""
              width={64}
              height={80}
              className="h-full w-full object-cover"
              style={portraitObjectPosition ? { objectPosition: portraitObjectPosition } : undefined}
            />
          </div>
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-medium">{provenanceLabel}</p>
            <p className="text-xs text-muted-foreground">{provenanceCredit}</p>
            {provenanceNote && <p className="text-xs text-muted-foreground">{provenanceNote}</p>}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                View source artwork
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
