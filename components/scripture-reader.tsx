'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Search, MessageSquare, Link, StickyNote, ImageIcon, BookOpen } from 'lucide-react'
import { Annotation, AnnotationType, Book, Chapter } from '@/types/scripture'
import { useAnnotations } from '@/hooks/use-annotations'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'

const getAnnotationIcon = (type: AnnotationType) => {
  switch (type) {
    case 'note':
      return <StickyNote className="h-4 w-4" />
    case 'link':
      return <Link className="h-4 w-4" />
    case 'photo':
      return <ImageIcon className="h-4 w-4" />
    case 'combo':
      return <MessageSquare className="h-4 w-4" />
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
  const [selectedText, setSelectedText] = useState('')
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number | null>(null)
  const { annotations, addAnnotation, removeAnnotation } = useAnnotations()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('annotation-menu')
      if (menu && !menu.contains(event.target as Node)) {
        setMenuPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextSelection = (verseNumber: number) => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectedText(selection.toString())
      setCurrentVerseNumber(verseNumber)
      setMenuPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY
      })
    }
  }

  const handleAddAnnotation = (annotationData: Omit<Annotation, 'id' | 'verseNumber' | 'createdAt' | 'highlightedText'>) => {
    if (selectedText && currentVerseNumber) {
      addAnnotation({
        ...annotationData,
        verseNumber: currentVerseNumber,
        highlightedText: selectedText,
      })
      setSelectedText('')
      setMenuPosition(null)
      setCurrentVerseNumber(null)
    }
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

    return <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <div>
      <div className="relative flex items-center mx-4 mt-4">
        <Breadcrumb className='flex-grow'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Book of Mormon</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{book.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{chapter.chapter_title}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder="Search in chapter..."
          className='max-w-96'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
              <h1 className="text-3xl font-bold">{book.title} {chapter.heading}</h1>
              <p className="text-muted-foreground">{chapter.summary}</p>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {chapter.verses.map((verse) => {
                  const verseAnnotations = annotations.filter(a => a.verseNumber === verse.number)
                  return (
                    <div
                      key={verse.number}
                      className="group relative"
                      onMouseUp={() => handleTextSelection(verse.number)}
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
            </ScrollArea>

            {/* Chapter Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Chapter
              </Button>
              <Button variant="outline">
                Next Chapter
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Annotations Panel */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:hidden mb-4">
                View Annotations
              </Button>
            </SheetTrigger>
            <div className="hidden md:block">
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
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Annotations</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Same content as the desktop panel */}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Annotation Menu */}
        <div id="annotation-menu">
          <AnnotationMenu
            position={menuPosition}
            selectedText={selectedText}
            onClose={() => setMenuPosition(null)}
            onSave={handleAddAnnotation}
          />
        </div>
      </div>
    </div>
  )
}

