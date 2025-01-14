'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, BookOpen, LinkIcon, StickyNoteIcon, MessageSquareIcon } from 'lucide-react'
import { Annotation, AnnotationType, Book, Chapter } from '@/types/scripture'
import { useAnnotations } from '@/hooks/use-annotations'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/use-mobile'

interface SelectionInfo {
  text: string;
  range: Range;
}

const getAnnotationIcon = (type: AnnotationType) => {
  switch (type) {
    case 'note':
      return <StickyNoteIcon className="h-4 w-4" />
    case 'link':
      return <LinkIcon className="h-4 w-4" />
    case 'photo':
      return <ImageIcon className="h-4 w-4" />
    case 'combo':
      return <MessageSquareIcon className="h-4 w-4" />
    default:
      return null
  }
}

const getHighlightStyle = (color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink', style: 'bold' | 'italic' | 'underline' | 'none') => {
  const colorClasses = {
    yellow: 'bg-yellow-200 dark:bg-yellow-900',
    green: 'bg-green-200 dark:bg-green-900',
    blue: 'bg-blue-200 dark:bg-blue-900',
    purple: 'bg-purple-200 dark:bg-purple-900',
    pink: 'bg-pink-200 dark:bg-pink-900',
  }
  
  const styleClasses = {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    none: '',
  }

  return `${colorClasses[color]} ${styleClasses[style]}`
}

export default function ScriptureReader({chapter, book}: {chapter: Chapter, book: Book}) {
  const [showVerseNumbers, setShowVerseNumbers] = useState(true)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<SelectionInfo | null>(null)
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number | null>(null)
  const { annotations, addAnnotation, removeAnnotation } = useAnnotations()
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useIsMobile()
  const [annotationsOpen, setAnnotationsOpen] = useState(false)

  const chapterNumber = Number(chapter.chapter_title.slice(8))
  const isFirstChapter = chapterNumber == 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menu = document.getElementById('annotation-menu')
      if (menu && !menu.contains(event.target as Node)) {
        setMenuPosition(null)
        setCurrentSelection(null)
        window.getSelection()?.removeAllRanges()
      }
    }

    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleTextSelection = (verseNumber: number) => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }
    // Set a small timeout to allow the selection to complete
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Calculate position considering mobile viewport
        const x = Math.max(16, rect.left + window.scrollX)
        let y = rect.bottom + 8;
        const windowHeight = window.innerHeight;
        
        // Calculate the distance from the bottom of the element to the viewport bottom
        const distanceToBottom = windowHeight - rect.bottom;
        // If the space available is less than the height of your annotation window plus the offset
        if (distanceToBottom < 300) {
          y -= Math.max(450, distanceToBottom + 100)
        }
        const width = Math.min(320, window.innerWidth - 32)

        setCurrentSelection({
          text: selection.toString(),
          range: range.cloneRange() // Store a copy of the range
        })
        setCurrentVerseNumber(verseNumber)
        setMenuPosition({ x, y, width })
      }
    }, 10)
  }

  const handleAddAnnotation = (annotationData: Omit<Annotation, 'id' | 'verseNumber' | 'createdAt' | 'highlightedText'>) => {
    if (currentSelection && currentVerseNumber) {
      addAnnotation({
        ...annotationData,
        verseNumber: currentVerseNumber,
        highlightedText: currentSelection.text,
      })
      setMenuPosition(null)
      setCurrentVerseNumber(null)
      setCurrentSelection(null)
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleCloseMenu = () => {
    setMenuPosition(null)
    setCurrentSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const renderVerseText = (verse: { number: number; text: string }) => {
    let text = verse.text
    const verseAnnotations = annotations.filter(a => a.verseNumber === verse.number)
    
    verseAnnotations.forEach(annotation => {
      const highlightClass = getHighlightStyle(annotation.color, annotation.style)
      text = text.replace(
        annotation.highlightedText,
        `<span class="${highlightClass}">${annotation.highlightedText}</span>`
      )
    })

    // If there's a current selection for this verse, add a temporary highlight
    if (currentSelection && currentVerseNumber === verse.number) {
      const tempHighlightClass = 'bg-blue-100 dark:bg-blue-900'
      text = text.replace(
        currentSelection.text,
        `<span class="${tempHighlightClass}">${currentSelection.text}</span>`
      )
    }

    return <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash) {
            const verseElement = document.querySelector(hash);
            if (verseElement) {
              verseElement.classList.add(
                "bg-yellow-200",
                "transition-colors",
                "duration-1000",
                "ease-in-out",
                "opacity-100"
              );

              // Remove the highlight effect after 2 seconds
              setTimeout(() => {
                  verseElement.classList.add("opacity-0");
                  setTimeout(() => {
                      verseElement.classList.remove("bg-yellow-200", "opacity-0");
                  }, 1000); // Wait for fade-out to finish
              }, 2000);
              const offset = 80
              const elementPosition = verseElement.getBoundingClientRect().top + window.scrollY;
              const offsetPosition = elementPosition - offset;

              window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth"
              });
            }
        }
    }
}, []);

  return (
    <div>
      <div className="relative flex items-center mx-4 mt-4">
        <Breadcrumb className='flex-grow'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/book/the-first-book-of-nephi/chapter/chapter_1">Book of Mormon</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/book/${encodeURIComponent(book.title.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_1`}>{book.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#top">{chapter.chapter_title}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowVerseNumbers(!showVerseNumbers)}
          >
            <BookOpen className="h-5 w-5" />
          </Button>
      </div>


      <div className="container mx-auto p-4 space-y-6 bg-background text-foreground">
        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              {
                isFirstChapter && (
                  <>
                    <h1 className="text-3xl font-bold">{book.title}</h1>
                    <h2 className="text-xl font-bold">{book.subtitle}</h2>
                    <h3 className="text-lg">{book.intro}</h3>
                  </>
              )}
              {
                chapter.chapter_heading ?
                <p>{chapter.chapter_heading}</p>
                : null
              }
              <h4 className='text-muted-foreground text-center'>{chapter.chapter_title}</h4>
              <p className="text-muted-foreground">{chapter.summary}</p>
            </div>

            <div className="space-y-4">
              {chapter.verses.map((verse) => {
                const verseAnnotations = annotations.filter(a => a.verseNumber === verse.number)
                return (
                  <div
                    id={`verse-${verse.number}`}
                    key={verse.number}
                    className="group relative"
                    onMouseUp={() => handleTextSelection(verse.number)}
                    onTouchEnd={(e) => {
                      e.preventDefault() // Prevent default touch behavior
                      handleTextSelection(verse.number)
                    }}
                  >
                    <div className="flex gap-2">
                      {showVerseNumbers && (
                        <span className="text-sm text-muted-foreground font-medium w-6 shrink-0">
                          {verse.number}
                        </span>
                      )}
                      {renderVerseText(verse)}
                    </div>
                    {verseAnnotations.length > 0 && (
                      <div className="absolute -right-8 top-1 flex flex-col gap-1">
                        {verseAnnotations.map((annotation) => (
                          <Button
                            key={annotation.id}
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 p-1 text-${annotation.color}-600`}
                            onClick={() => {
                              if (isMobile) {
                                //open annotations
                                setAnnotationsOpen(true)
                              }
                              else {
                                const element = document.getElementById('annotations-panel');
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: 'smooth', // Smooth scroll animation
                                    block: 'start',     // Align to the top of the viewport
                                  });
                                }
                              }
                            }}
                          >
                            {getAnnotationIcon(annotation.type)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Chapter Navigation */}
            <div className="flex justify-between pt-4">
              {
                !isFirstChapter ?
                <Link 
                  className={buttonVariants({'variant': 'outline'})}
                  href={`/book/${encodeURIComponent(book.title.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${chapterNumber - 1}`}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Previous Chapter
                </Link>
                :
                null
              }
              <Link 
                className={buttonVariants({'variant': 'outline'})}
                href={`/book/${encodeURIComponent(book.title.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${chapterNumber + 1}`}
              >
                Next Chapter
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>

            <div className="hidden md:block" id='annotations-panel'>
              <div className="border rounded-lg p-4 space-y-4">
                <h2 className="font-semibold">Annotations</h2>
                {annotations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Select text to add annotations.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {annotations.map((annotation) => (
                      <div key={annotation.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">Verse {annotation.verseNumber}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnnotation(annotation.id)}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color, annotation.style)}`}>
                          &ldquo;{annotation.highlightedText}&rdquo;
                        </p>
                        <p className="text-sm">{annotation.text}</p>
                        {annotation.url && (
                          <a
                            href={annotation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Reference
                          </a>
                        )}
                        {annotation.photoUrl && (
                          <Image
                            src={annotation.photoUrl}
                            alt="Annotation"
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Annotations Panel */}
          <Sheet open={annotationsOpen} onOpenChange={(b) => setAnnotationsOpen(b)}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:hidden mb-4" onClick={() => setAnnotationsOpen(true)}>
                View Annotations
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Annotations</SheetTitle>
              </SheetHeader>
                <div className="space-y-4">
                  {annotations.map((annotation) => (
                    <div key={annotation.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">Verse {annotation.verseNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnnotation(annotation.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color, annotation.style)}`}>
                        &ldquo;{annotation.highlightedText}&rdquo;
                      </p>
                      <p className="text-sm">{annotation.text}</p>
                      {annotation.url && (
                        <a
                          href={annotation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Reference
                        </a>
                      )}
                      {annotation.photoUrl && (
                        <Image
                          src={annotation.photoUrl}
                          alt="Annotation"
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Annotation Menu */}
        <div id="annotation-menu">
          <AnnotationMenu
            position={menuPosition}
            onSave={handleAddAnnotation}
            selectedText={currentSelection?.text || ''}
            onClose={handleCloseMenu}
          />
        </div>
      </div>
    </div>
  )
}
