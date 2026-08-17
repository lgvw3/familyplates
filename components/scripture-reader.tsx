'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeftIcon, ChevronRightIcon, MessageCircleIcon } from 'lucide-react'
import { Annotation, AnnotationTarget, AnnotationType, Book, Chapter, HighlightColor } from '@/types/scripture'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/use-websockets'
import { debounce } from 'lodash'
import { saveBookmark } from '@/lib/reading/action'
import { useHeader } from './header-context'
import { AnchoredSelection, AnnotatedText } from './annotated-text'
import { sortAnnotationsByTarget, TextUnit } from '@/lib/highlights/ranges'
import { AnnotationQuote } from './feed/annotation-quote'

interface ScriptureReaderProps {
  chapter: Chapter
  book: Book
  initialAnnotations: Annotation[]
  currentUserId: number
  chapters: string[]
  nextBook: string | null
  previousBook: string | null
  previousBookLastChapter: number
}

interface AnnotationMenuValue {
  text: string
  type: AnnotationType
  color: HighlightColor
  url?: string
  photoUrl?: string
}

export default function ScriptureReader({
  chapter,
  book,
  initialAnnotations,
  currentUserId,
  chapters,
  nextBook,
  previousBook,
  previousBookLastChapter,
}: ScriptureReaderProps) {
  const chapterNumber = Number(chapter.chapter_title.slice(8))
  const bookId = book.title.toLowerCase().replaceAll(' ', '-')
  const targetKey = `scripture:${bookId}:${chapterNumber}`
  const isFirstChapter = chapterNumber === 1
  const { annotations, addAnnotation, notification, setNotification } = useWebSocket(initialAnnotations, false, targetKey)
  const [annotationComposerOpen, setAnnotationComposerOpen] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<AnchoredSelection | null>(null)
  const [draftColor, setDraftColor] = useState<HighlightColor>('yellow')
  const [annotationsOpen, setAnnotationsOpen] = useState(false)
  const [currentAnnotationIds, setCurrentAnnotationIds] = useState<string[]>([])
  const [currentVisibleVerse, setCurrentVisibleVerse] = useState(1)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const { setHeader } = useHeader()
  const router = useRouter()

  const units = useMemo<TextUnit[]>(() => chapter.verses.map((verse) => ({
    unit: verse.number,
    label: verse.number.toString(),
    text: verse.text,
  })), [chapter.verses])

  const selectedTarget = useMemo<AnnotationTarget | null>(() => currentSelection ? ({
    kind: 'scripture',
    sourceVersion: 'book-of-mormon-local-v1',
    bookId,
    chapterNumber,
    start: currentSelection.start,
    end: currentSelection.end,
    quote: { exact: currentSelection.quote },
  }) : null, [bookId, chapterNumber, currentSelection])

  const sortedAnnotations = useMemo(() => sortAnnotationsByTarget(annotations), [annotations])

  useEffect(() => {
    if (notification && notification.userId !== currentUserId) {
      toast(`New ${notification.type} by ${notification.userName}`, { position: 'top-center' })
      setNotification(null)
    }
  }, [currentUserId, notification, setNotification])

  const handleSelection = (selection: AnchoredSelection) => {
    setCurrentSelection(selection)
    setAnnotationComposerOpen(true)
  }

  const handleCloseMenu = () => {
    setAnnotationComposerOpen(false)
    setCurrentSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleAddAnnotation = async (value: AnnotationMenuValue) => {
    if (!currentSelection) return false

    const result = await saveAnnotation({
      _id: null,
      schemaVersion: 2,
      target: {
        kind: 'scripture',
        sourceVersion: 'book-of-mormon-local-v1',
        bookId,
        chapterNumber,
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
    handleCloseMenu()
    return true
  }

  const renderAnnotationPanel = () => {
    const visibleAnnotations = sortedAnnotations.filter((annotation) =>
      currentAnnotationIds.length ? currentAnnotationIds.includes(annotation._id?.toString() ?? '') : true,
    )

    if (!visibleAnnotations.length) {
      return <p className="text-muted-foreground text-sm">Select text to add annotations.</p>
    }

    return (
      <div className="space-y-4">
        {visibleAnnotations.map((annotation) => (
            <div
              key={annotation._id?.toString()}
              className="space-y-2 rounded border p-3 transition-colors hover:bg-accent/50"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a, button, input, textarea, select, label')) return
                router.push(`/annotation/${annotation._id?.toString()}`)
              }}
            >
              <AnnotationQuote annotation={annotation} variant="panel" />
              {annotation.text && <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{annotation.userName}</span>
                <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
              </div>
              {annotation.comments.length > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <MessageCircleIcon className="h-4 w-4" /> {annotation.comments.length}
                </span>
              )}
              {annotation.url && <span className="text-sm text-blue-600">View Reference</span>}
              {annotation.photoUrl && (
                <Image src={annotation.photoUrl} alt="Annotation" width={400} height={128} className="w-full h-32 object-cover rounded" />
              )}
              <Link
                href={`/annotation/${annotation._id?.toString()}`}
                className="inline-flex text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Open annotation
              </Link>
            </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    const scrollToHash = () => {
      const verseId = window.location.hash.slice(1)
      if (!verseId) return

      const verseElement = document.getElementById(verseId)
      if (!verseElement) return

      const offset = 80
      const top = verseElement.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }

    const handleHashChange = () => {
      scrollToHash()
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [bookId, chapterNumber, units])

  useEffect(() => {
    const root = textContainerRef.current
    if (!root) return
    const verses = root.querySelectorAll('.verse')
    const observer = new IntersectionObserver((entries) => {
      const closest = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight / 2) - Math.abs(b.boundingClientRect.top - window.innerHeight / 2))[0]
      const verse = closest?.target.getAttribute('data-verse-id')
      if (verse) setCurrentVisibleVerse(Number(verse))
    }, { threshold: 0.5 })
    verses.forEach((verse) => observer.observe(verse))
    return () => observer.disconnect()
  }, [units])

  useEffect(() => {
    const save = debounce((verseNumber: number) => saveBookmark({
      _id: null,
      verseNumber,
      bookId,
      chapterNumber,
      userId: 0,
      lastRead: new Date(),
    }), 3000)
    save(currentVisibleVerse)
    return () => save.cancel()
  }, [bookId, chapterNumber, currentVisibleVerse])

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyHeader(!entry.isIntersecting))
    observer.observe(heading)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setHeader(showStickyHeader ? chapter.chapter_title : undefined, showStickyHeader ? book.title : undefined)
    return () => setHeader(undefined, undefined)
  }, [book.title, chapter.chapter_title, setHeader, showStickyHeader])

  return (
    <div>
      <div className="relative flex items-center mx-4 mt-4">
        <Breadcrumb className="flex-grow">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/book/the-first-book-of-nephi/chapter/chapter_1">Book of Mormon</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={`/book/${encodeURIComponent(bookId)}/chapter/chapter_1`}>{book.title}</BreadcrumbLink></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container mx-auto p-4 space-y-6 bg-background text-foreground">
        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              {isFirstChapter && <><h1 className="text-3xl font-bold">{book.title}</h1><h2 className="text-xl font-bold">{book.subtitle}</h2><h3 className="text-lg font-serif">{book.intro}</h3></>}
              {chapter.chapter_heading && <p className="font-serif">{chapter.chapter_heading}</p>}
              {chapter.chapter_notes && <p className="text-muted-foreground font-serif italic">{chapter.chapter_notes}</p>}
              <h4 ref={headingRef} className="text-center font-serif">{chapter.chapter_title}</h4>
              <p className="text-muted-foreground font-serif">{chapter.summary}</p>
            </div>

            <div ref={textContainerRef} className="relative">
              <AnnotatedText
                units={units}
                annotations={sortedAnnotations}
                draft={currentSelection ? { ...currentSelection, color: draftColor } : null}
                onSelection={handleSelection}
                onAnnotationsClick={(ids) => {
                  setCurrentAnnotationIds(ids)
                  setAnnotationsOpen(true)
                }}
                className="text-lg leading-relaxed font-serif pr-4"
              />
            </div>

            <div className="flex justify-between pt-4">
              {!isFirstChapter ? (
                <Link className={buttonVariants({ variant: 'outline' })} href={`/book/${encodeURIComponent(bookId)}/chapter/chapter_${chapterNumber - 1}`}><ChevronLeftIcon className="h-4 w-4 mr-2" />Previous Chapter</Link>
              ) : previousBook ? (
                <Link className={buttonVariants({ variant: 'outline' })} href={`/book/${encodeURIComponent(previousBook.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${previousBookLastChapter}`}><ChevronLeftIcon className="h-4 w-4 mr-2" />Previous Book</Link>
              ) : (
                <Link className={buttonVariants({ variant: 'outline' })} href="/intro/brief-explanation-about-the-book-of-mormon"><ChevronLeftIcon className="h-4 w-4 mr-2" />Previous</Link>
              )}
              {chapters.length > chapterNumber ? (
                <Link className={buttonVariants({ variant: 'outline' })} href={`/book/${encodeURIComponent(bookId)}/chapter/chapter_${chapterNumber + 1}`}>Next Chapter<ChevronRightIcon className="h-4 w-4 ml-2" /></Link>
              ) : nextBook ? (
                <Link className={buttonVariants({ variant: 'outline' })} href={`/book/${encodeURIComponent(nextBook.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_1`}>Next Book<ChevronRightIcon className="h-4 w-4 ml-2" /></Link>
              ) : <span>The End</span>}
            </div>
          </div>

          <div className="hidden md:block"><div className="border rounded-lg p-4 space-y-4"><h2 className="font-semibold">Annotations</h2>{renderAnnotationPanel()}</div></div>

          <Sheet open={annotationsOpen} onOpenChange={(open) => { setAnnotationsOpen(open); if (!open) setCurrentAnnotationIds([]) }}>
            <Button variant="outline" className="w-full md:hidden mb-4" onClick={() => setAnnotationsOpen(true)}>View Annotations</Button>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Annotations</SheetTitle><SheetDescription className="sr-only">Annotations for this chapter</SheetDescription></SheetHeader>
              {renderAnnotationPanel()}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div id="annotation-menu">
        <AnnotationMenu
          open={annotationComposerOpen}
          target={selectedTarget}
          quote={currentSelection?.quote}
          color={draftColor}
          onColorChange={setDraftColor}
          onSave={handleAddAnnotation}
          onClose={handleCloseMenu}
        />
      </div>
    </div>
  )
}
