'use client'

import { useRef } from 'react'
import { Annotation, HighlightColor, TextRangePoint } from '@/types/scripture'
import {
  DraftHighlight,
  getQuoteForRange,
  normalizeRange,
  segmentTextUnit,
  TextUnit,
} from '@/lib/highlights/ranges'
import { cn } from '@/lib/utils'

export interface AnchoredSelection {
  start: TextRangePoint
  end: TextRangePoint
  quote: string
}

interface AnnotatedTextProps {
  units: TextUnit[]
  annotations: Annotation[]
  draft: DraftHighlight | null
  onSelection: (selection: AnchoredSelection) => void
  onAnnotationsClick?: (annotationIds: string[]) => void
  className?: string
  labelClassName?: string
}

const singleHighlightClasses: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900',
  green: 'bg-green-200 dark:bg-green-900',
  blue: 'bg-blue-200 dark:bg-blue-900',
  purple: 'bg-purple-200 dark:bg-purple-900',
  pink: 'bg-pink-200 dark:bg-pink-900',
}

const highlightColors: Record<HighlightColor, string> = {
  yellow: 'rgba(250, 204, 21, .48)',
  green: 'rgba(74, 222, 128, .48)',
  blue: 'rgba(96, 165, 250, .48)',
  purple: 'rgba(192, 132, 252, .48)',
  pink: 'rgba(244, 114, 182, .48)',
}

const draftColors: Record<HighlightColor, string> = {
  yellow: '#ca8a04',
  green: '#16a34a',
  blue: '#2563eb',
  purple: '#9333ea',
  pink: '#db2777',
}

const draftFillColors: Record<HighlightColor, string> = {
  yellow: 'rgba(250, 204, 21, .22)',
  green: 'rgba(74, 222, 128, .22)',
  blue: 'rgba(96, 165, 250, .22)',
  purple: 'rgba(192, 132, 252, .22)',
  pink: 'rgba(244, 114, 182, .22)',
}

function getElement(node: Node) {
  return node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
}

function getBoundaryPoint(root: HTMLElement, container: Node, offset: number): TextRangePoint | null {
  const unitElement = getElement(container)?.closest<HTMLElement>('[data-highlight-unit]')
  if (!unitElement || !root.contains(unitElement)) return null

  const prefix = document.createRange()
  prefix.selectNodeContents(unitElement)
  try {
    prefix.setEnd(container, offset)
  } catch {
    return null
  }

  return {
    unit: Number(unitElement.dataset.highlightUnit),
    offset: prefix.toString().length,
  }
}

function getOverlapBackground(colors: HighlightColor[]) {
  const size = 100 / colors.length
  const stops = colors.flatMap((color, index) => {
    const start = (index * size).toFixed(2)
    const end = ((index + 1) * size).toFixed(2)
    return [`${highlightColors[color]} ${start}%`, `${highlightColors[color]} ${end}%`]
  })
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}

export function AnnotatedText({
  units,
  annotations,
  draft,
  onSelection,
  onAnnotationsClick,
  className,
  labelClassName,
}: AnnotatedTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const captureSelection = () => {
    window.setTimeout(() => {
      const root = rootRef.current
      const selection = window.getSelection()
      if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const start = getBoundaryPoint(root, range.startContainer, range.startOffset)
      const end = getBoundaryPoint(root, range.endContainer, range.endOffset)
      if (!start || !end) return

      const normalized = normalizeRange(start, end)
      const quote = getQuoteForRange(units, normalized.start, normalized.end)
      if (!quote) return

      onSelection({ ...normalized, quote })
      selection.removeAllRanges()
    }, 0)
  }

  return (
    <div
      ref={rootRef}
      className={cn('whitespace-pre-line selection:bg-sky-300/40 dark:selection:bg-sky-600/40', className)}
      onMouseUp={captureSelection}
      onTouchEnd={captureSelection}
      onKeyUp={captureSelection}
      onClick={(event) => {
        if (!onAnnotationsClick || !window.getSelection()?.isCollapsed) return
        const segment = (event.target as HTMLElement).closest<HTMLElement>('[data-annotation-ids]')
        const ids = segment?.dataset.annotationIds?.split(' ').filter(Boolean) ?? []
        if (ids.length) onAnnotationsClick(ids)
      }}
    >
      {units.map((unit, unitIndex) => (
        <span key={unit.unit} data-highlight-unit-row={unit.unit}>
          {unit.label && (
            <span
              className={cn('verse select-none', labelClassName)}
              data-verse-id={unit.unit}
              id={`verse-${unit.unit}`}
              aria-label={`Verse ${unit.label}`}
            >
              {unit.label}&nbsp;
            </span>
          )}
          <span data-highlight-unit={unit.unit}>
            {segmentTextUnit(unit, annotations, draft).map((segment) => {
              const colors = [...new Set(segment.annotations.map((annotation) => annotation.color))]
              const annotationIds = segment.annotations
                .map((annotation) => annotation._id?.toString())
                .filter(Boolean)
                .join(' ')
              const overlapBackground = colors.length > 1 ? getOverlapBackground(colors) : undefined
              const draftBackground = segment.draft
                ? `linear-gradient(${draftFillColors[draft?.color ?? 'blue']}, ${draftFillColors[draft?.color ?? 'blue']})`
                : undefined
              const backgroundImage = [draftBackground, overlapBackground].filter(Boolean).join(', ') || undefined

              return (
                <span
                  key={`${unit.unit}-${segment.start}`}
                  className={cn(
                    'box-decoration-clone',
                    colors.length === 1 && singleHighlightClasses[colors[0]],
                  )}
                  data-annotation-ids={annotationIds || undefined}
                  style={{
                    backgroundImage,
                    boxShadow: segment.draft
                      ? `inset 0 -3px ${draftColors[draft?.color ?? 'blue']}`
                      : undefined,
                    WebkitBoxDecorationBreak: 'clone',
                  }}
                >
                  {segment.text}
                </span>
              )
            })}
          </span>
          {unitIndex < units.length - 1 ? '\n\n' : null}
        </span>
      ))}
    </div>
  )
}
