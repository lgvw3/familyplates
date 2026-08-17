'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AnnotationTarget, AnnotationType, HighlightColor, ScriptureAttribution } from '../types/scripture'
import { LinkIcon, StickyNoteIcon, ImageIcon, ChevronDownIcon, Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScriptureAttributionByline } from '@/components/scripture-people/scripture-attribution-byline'
import { previewScriptureAttribution } from '@/lib/scripture-attribution/data'
import { cn } from '@/lib/utils'

interface AnnotationMenuProps {
  open: boolean;
  onClose: () => void;
  color: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
  onSave: (annotation: {
    text: string;
    type: AnnotationType;
    color: HighlightColor;
    url?: string;
    photoUrl?: string;
  }) => Promise<boolean>;
  target?: AnnotationTarget | null;
  quote?: string;
}

function QuotePreview({ quote, attribution, loading }: {
  quote: string
  attribution: ScriptureAttribution | null
  loading: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isTruncated = quote.length > 100
  const displayedQuote = !expanded && isTruncated ? `${quote.slice(0, 100).trimEnd()}…` : quote

  return (
    <div
      className={cn(
        'rounded-md border bg-muted/30 p-4 text-left transition-colors',
        isTruncated && 'cursor-pointer hover:bg-muted/50',
      )}
      onClick={() => isTruncated && setExpanded((current) => !current)}
      onKeyDown={(event) => {
        if (isTruncated && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          setExpanded((current) => !current)
        }
      }}
      role={isTruncated ? 'button' : undefined}
      tabIndex={isTruncated ? 0 : undefined}
      aria-expanded={isTruncated ? expanded : undefined}
      data-testid="annotation-composer-quote"
    >
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-2">
        {loading ? (
          <>
            <div className="size-8 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          </>
        ) : (
          <ScriptureAttributionByline attribution={attribution} size="default" layout="quote" />
        )}
        <div className="col-span-2 min-w-0">
          <p className="whitespace-pre-line rounded px-1.5 py-1 text-sm font-medium leading-relaxed">
            {displayedQuote}
          </p>
          {isTruncated && (
            <span className="flex items-center gap-1 px-1.5 pt-1 text-xs text-muted-foreground">
              {expanded ? 'Show less' : 'Show more'} <ChevronDownIcon className={cn('size-3 transition-transform', expanded && 'rotate-180')} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AnnotationMenu({ open, onClose, onSave, color, onColorChange, target, quote }: AnnotationMenuProps) {
  const [type, setType] = useState<AnnotationType>('note')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [attribution, setAttribution] = useState<ScriptureAttribution | null>(null)
  const [loadingAttribution, setLoadingAttribution] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open || !target) return

    let active = true
    const loadAttribution = async () => {
      setLoadingAttribution(true)
      try {
        const result = await previewScriptureAttribution(target)
        if (active) setAttribution(result)
      } catch {
        if (active) setAttribution(null)
      } finally {
        if (active) setLoadingAttribution(false)
      }
    }
    void loadAttribution()

    return () => {
      active = false
    }
  }, [open, target])

  useEffect(() => {
    if (!open) return

    const bodyOverflow = document.body.style.overflow
    const documentOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = documentOverflow
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    const saved = await onSave({
      type,
      color,
      text,
      ...(url && { url }),
      ...(photoUrl && { photoUrl })
    })
    setSaving(false)
    if (saved) {
      setText('')
      setUrl('')
      setPhotoUrl('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          textareaRef.current?.focus({ preventScroll: true })
        }}
        className="inset-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-none border-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] [&>button:last-child]:hidden !animate-none !duration-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(720px,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:overflow-hidden sm:rounded-lg sm:border sm:p-6 sm:[&>button:last-child]:block"
      >
        <DialogHeader className="shrink-0 pr-10 text-left">
          <DialogTitle className="sr-only sm:not-sr-only">Create an annotation</DialogTitle>
          <DialogDescription className="sr-only sm:not-sr-only">Add a thought about the selected scripture.</DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:hidden">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!text.trim() || saving} aria-label="Share annotation">
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : 'Share'}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain py-6 sm:py-0">
          {quote && <QuotePreview quote={quote} attribution={attribution} loading={loadingAttribution} />}

          <div className="flex shrink-0 items-center justify-between gap-3">
            <div className="flex gap-1">
              <Button type="button" variant={type === 'note' ? 'default' : 'ghost'} size="sm" onClick={() => setType('note')} aria-label="Note annotation"><StickyNoteIcon className="size-4" /></Button>
              <Button type="button" variant={type === 'link' ? 'default' : 'ghost'} size="sm" onClick={() => setType('link')} aria-label="Link annotation"><LinkIcon className="size-4" /></Button>
              <Button type="button" variant={type === 'photo' ? 'default' : 'ghost'} size="sm" onClick={() => setType('photo')} aria-label="Photo annotation"><ImageIcon className="size-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="annotation-color" className="text-xs text-muted-foreground">Highlight</Label>
              <Select value={color} onValueChange={(value) => onColorChange(value as HighlightColor)}>
                <SelectTrigger id="annotation-color" className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            autoFocus
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add your annotation..."
            className="min-h-40 flex-1 resize-none overflow-y-auto p-4 text-lg"
            data-testid="annotation-composer-textarea"
          />

          {type === 'link' && (
            <div className="shrink-0 space-y-2">
              <Label htmlFor="annotation-url">URL</Label>
              <Input id="annotation-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
            </div>
          )}

          {type === 'photo' && (
            <div className="shrink-0 space-y-2">
              <Label htmlFor="annotation-photo-url">Photo URL</Label>
              <Input id="annotation-photo-url" type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
            </div>
          )}
        </div>

        <div className="hidden shrink-0 justify-end sm:flex">
          <Button onClick={handleSave} disabled={!text.trim() || saving}>
            {saving ? 'Saving…' : 'Share annotation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
