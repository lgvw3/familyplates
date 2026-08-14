'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeftIcon, ChevronRightIcon, MessageCircleIcon } from 'lucide-react'
import { Annotation, AnnotationType, HighlightColor, Intro } from '@/types/scripture'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import Link from 'next/link'
import { introMaterialOrder } from './navigation'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/use-websockets'
import { AnchoredSelection, AnnotatedText } from './annotated-text'
import { sortAnnotationsByTarget, TextUnit } from '@/lib/highlights/ranges'
import { getAnnotationQuote } from '@/lib/annotations/presentation'

const getHighlightStyle = (color: HighlightColor) => ({
  yellow: 'bg-yellow-200 dark:bg-yellow-900',
  green: 'bg-green-200 dark:bg-green-900',
  blue: 'bg-blue-200 dark:bg-blue-900',
  purple: 'bg-purple-200 dark:bg-purple-900',
  pink: 'bg-pink-200 dark:bg-pink-900',
})[color]

interface AnnotationMenuValue {
  text: string
  type: AnnotationType
  color: HighlightColor
  url?: string
  photoUrl?: string
}

export default function IntroReader({
  intro,
  introId,
  initialAnnotations,
  currentUserId,
}: {
  intro: Intro
  introId: string
  initialAnnotations: Annotation[]
  currentUserId: number
}) {
  const targetKey = `intro:${introId}`
  const { annotations, addAnnotation, notification, setNotification } = useWebSocket(initialAnnotations, false, targetKey)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<AnchoredSelection | null>(null)
  const [draftColor, setDraftColor] = useState<HighlightColor>('yellow')
  const [annotationsOpen, setAnnotationsOpen] = useState(false)
  const [currentAnnotationIds, setCurrentAnnotationIds] = useState<string[]>([])
  const introIndex = introMaterialOrder.indexOf(intro.title)
  const previousPage = introIndex > 0 ? introMaterialOrder[introIndex - 1] : null
  const nextPage = introIndex < introMaterialOrder.length - 1 ? introMaterialOrder[introIndex + 1] : null

  const units = useMemo<TextUnit[]>(() => intro.paragraphs.map((text, index) => ({ unit: index, text })), [intro.paragraphs])
  const sortedAnnotations = useMemo(() => sortAnnotationsByTarget(annotations), [annotations])

  useEffect(() => {
    if (notification && notification.userId !== currentUserId) {
      toast(`New ${notification.type} by ${notification.userName}`, { position: 'top-center' })
      setNotification(null)
    }
  }, [currentUserId, notification, setNotification])

  const closeMenu = () => {
    setMenuPosition(null)
    setCurrentSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const save = async (value: AnnotationMenuValue) => {
    if (!currentSelection) return false
    const result = await saveAnnotation({
      _id: null,
      schemaVersion: 2,
      target: {
        kind: 'intro',
        sourceVersion: 'book-of-mormon-local-v1',
        introId,
        start: currentSelection.start,
        end: currentSelection.end,
        quote: { exact: currentSelection.quote },
      },
      text: value.text,
      type: value.type,
      color: value.color,
      createdAt: new Date(),
      userId: 0,
      userName: '',
      comments: [],
      likes: [],
      ...(value.url && { url: value.url }),
      ...(value.photoUrl && { photoUrl: value.photoUrl }),
    })

    if (!result.insertedId || !result.annotation) {
      toast.error(`Shoot! ${result.message}`)
      return false
    }

    addAnnotation({ ...result.annotation, _id: result.insertedId })
    toast.success('Note shared with the family!')
    closeMenu()
    return true
  }

  const visibleAnnotations = sortedAnnotations.filter((annotation) =>
    currentAnnotationIds.length ? currentAnnotationIds.includes(annotation._id?.toString() ?? '') : true,
  )

  const annotationPanel = visibleAnnotations.length ? (
    <div className="space-y-4">
      {visibleAnnotations.map((annotation) => (
        <Link key={annotation._id?.toString()} href={`/annotation/${annotation._id?.toString()}`}>
          <div className="space-y-2 rounded border p-3 hover:bg-accent/50 transition-colors">
            <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color)}`}>&ldquo;{getAnnotationQuote(annotation)}&rdquo;</p>
            {annotation.text && <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>}
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{annotation.userName}</span><span>{new Date(annotation.createdAt).toLocaleDateString()}</span></div>
            {annotation.comments.length > 0 && <span className="flex items-center gap-1 text-sm"><MessageCircleIcon className="h-4 w-4" /> {annotation.comments.length}</span>}
            {annotation.url && <span className="text-sm text-blue-600">View Reference</span>}
            {annotation.photoUrl && <Image src={annotation.photoUrl} alt="Annotation" width={400} height={128} className="w-full h-32 object-cover rounded" />}
          </div>
        </Link>
      ))}
    </div>
  ) : <p className="text-muted-foreground text-sm">Select text to add annotations.</p>

  return (
    <div className="container mx-auto p-4 space-y-6 bg-background text-foreground">
      <div className="grid md:grid-cols-[1fr,300px] gap-6">
        <div className="space-y-6">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold">{intro.title}</h1>
            <h2 className="text-2xl font-bold">{intro.header}</h2>
            <h2 className="text-xl font-bold">{intro.subtitle}</h2>
            <h2 className="text-xl font-bold">{intro.additional}</h2>
          </div>

          <AnnotatedText
            units={units}
            annotations={sortedAnnotations}
            draft={currentSelection ? { ...currentSelection, color: draftColor } : null}
            onSelection={(selection) => {
              setCurrentSelection(selection)
              setMenuPosition({ x: 0, y: 0, width: window.innerWidth })
            }}
            onAnnotationsClick={(ids) => {
              setCurrentAnnotationIds(ids)
              setAnnotationsOpen(true)
            }}
            className="text-lg leading-relaxed font-serif pr-4"
          />

          <div className="flex justify-between pt-4">
            {previousPage && <Link className={buttonVariants({ variant: 'outline' })} href={`/intro/${encodeURIComponent(previousPage.toLowerCase().replaceAll(' ', '-'))}`}><ChevronLeftIcon className="h-4 w-4 mr-2" />Previous Page</Link>}
            {nextPage ? <Link className={buttonVariants({ variant: 'outline' })} href={`/intro/${encodeURIComponent(nextPage.toLowerCase().replaceAll(' ', '-'))}`}>Next Page<ChevronRightIcon className="h-4 w-4 ml-2" /></Link> : <Link className={buttonVariants({ variant: 'outline' })} href="/book/the-first-book-of-nephi/chapter/chapter_1">Next<ChevronRightIcon className="h-4 w-4 ml-2" /></Link>}
          </div>
        </div>

        <div className="hidden md:block"><div className="border rounded-lg p-4 space-y-4"><h2 className="font-semibold">Annotations</h2>{annotationPanel}</div></div>
        <Sheet open={annotationsOpen} onOpenChange={(open) => { setAnnotationsOpen(open); if (!open) setCurrentAnnotationIds([]) }}>
          <Button variant="outline" className="w-full md:hidden mb-4" onClick={() => setAnnotationsOpen(true)}>View Annotations</Button>
          <SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>Annotations</SheetTitle></SheetHeader>{annotationPanel}</SheetContent>
        </Sheet>
      </div>

      <div id="annotation-menu"><AnnotationMenu position={menuPosition} color={draftColor} onColorChange={setDraftColor} onSave={save} onClose={closeMenu} /></div>
    </div>
  )
}
