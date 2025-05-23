'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, LinkIcon, StickyNoteIcon, MessageSquareIcon } from 'lucide-react'
import { Annotation, AnnotationType, Intro } from '@/types/scripture'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import Link from 'next/link'
import { introMaterialOrder } from './navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/use-websockets'

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

const getHighlightStyle = (color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink') => {
    const colorClasses = {
        yellow: 'bg-yellow-200 dark:bg-yellow-900',
        green: 'bg-green-200 dark:bg-green-900',
        blue: 'bg-blue-200 dark:bg-blue-900',
        purple: 'bg-purple-200 dark:bg-purple-900',
        pink: 'bg-pink-200 dark:bg-pink-900',
    }

    return colorClasses[color]
}

export default function IntroReader({intro, initialAnnotations, currentUserId}: {intro: Intro, initialAnnotations: Annotation[], currentUserId: number}) {
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number } | null>(null)
    const [currentSelection, setCurrentSelection] = useState<SelectionInfo | null>(null)
    const [currentVerseNumber, setCurrentVerseNumber] = useState<number | null>(null)
    const { annotations, addAnnotation, notification, setNotification } = useWebSocket(initialAnnotations, false, intro.title.replace(' ', '-').toLowerCase(), 1)
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [annotationsOpen, setAnnotationsOpen] = useState(false)
    const isMobile = useIsMobile()
    const isTitlePage = intro.title == 'Title Page'
    const introIndex = introMaterialOrder.indexOf(intro.title)
    let lastBook = ''
    if (introIndex > 0) {
        lastBook = introMaterialOrder[introIndex - 1]
    }

    if (notification && notification.userId != currentUserId) {
        toast(`New ${notification.type} by ${notification.userName}`, {position: 'top-center'})
        setNotification(null)
    }

    let nextBook = ''
    let nextIsIntro = true
    if (introIndex < introMaterialOrder.length - 1) {
        nextBook = introMaterialOrder[introIndex + 1]
    }
    else {
        nextIsIntro = false
        nextBook = 'the-firt-book-of-nephi'
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        const menu = document.getElementById('annotation-menu')
            if (menu && !menu.contains(event.target as Node)) {
                setMenuPosition(null)
                setCurrentSelection(null)
                window.getSelection()?.removeAllRanges()
            }
        }
        
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

    const handleAddAnnotation = async (annotationData: Omit<Annotation, '_id' | 'verseNumber' | 'createdAt' | 'highlightedText' | 'userId' | 'userName' | 'bookId' | 'chapterNumber' | 'comments' | 'likes'>) => {
        if (currentSelection && currentVerseNumber) {
            const results = await saveAnnotation({
                _id: null,
                verseNumber: currentVerseNumber,
                text: annotationData.text,
                highlightedText: currentSelection.text,
                type: annotationData.type,
                color: annotationData.color,
                createdAt: new Date(),
                userId: 0,
                userName: '',
                chapterNumber: 1,
                bookId: intro.title.toLowerCase().replaceAll(' ', '-'),
                comments: [],
                likes: []
            })
            if (results.insertedId) {
                toast.success('Note shared with the family!')
                addAnnotation({
                    ...results.annotation,
                    _id: results.insertedId,
                })
                setMenuPosition(null)
                setCurrentVerseNumber(null)
                setCurrentSelection(null)
                window.getSelection()?.removeAllRanges()
            }
            else {
                toast.success(`Shoot! ${results.message}`)
            }
        }
    }

    const handleCloseMenu = () => {
        setMenuPosition(null)
        setCurrentSelection(null)
        window.getSelection()?.removeAllRanges()
    }

    const renderIntroText = (index: number, text: string) => {
        const verseAnnotations = annotations.filter(a => a.verseNumber === index)
        
        verseAnnotations.forEach(annotation => {
            const highlightClass = getHighlightStyle(annotation.color)
            text = text.replace(
                annotation.highlightedText,
                `<span class="${highlightClass}">${annotation.highlightedText}</span>`
            )
        })

        // If there's a current selection for this verse, add a temporary highlight
        if (currentSelection && currentVerseNumber === index) {
            const tempHighlightClass = 'bg-blue-100 dark:bg-blue-900'
            text = text.replace(
                currentSelection.text,
                `<span class="${tempHighlightClass}">${currentSelection.text}</span>`
            )
        }

        return <p className="text-lg leading-relaxed font-serif mr-4" dangerouslySetInnerHTML={{ __html: text }} />
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            const hash = window.location.hash;
            if (hash) {
                const verseElement = document.querySelector(hash);
                if (verseElement) {
                    verseElement.classList.add(
                        "bg-yellow-200",
                        "dark:bg-yellow-800",
                        "transition-colors",
                        "duration-1000",
                        "ease-in-out",
                        "opacity-100"
                    );

                    // Remove the highlight effect after 2 seconds
                    setTimeout(() => {
                        verseElement.classList.add("opacity-0");
                        setTimeout(() => {
                            verseElement.classList.remove("bg-yellow-200", "dark:bg-yellow-800", "opacity-0");
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
        <div className="container mx-auto p-4 space-y-6 bg-background text-foreground">
            <div className="grid md:grid-cols-[1fr,300px] gap-6">
                <div className="space-y-6">
                    <div className="space-y-4 text-center">
                        <h1 className="text-3xl font-bold">{intro.title}</h1>
                        <h2 className='text-2xl font-bold'>{intro.header}</h2>
                        <h2 className='text-xl font-bold'>{intro.subtitle}</h2>
                        <h2 className='text-xl font-bold'>{intro.additional}</h2>
                    </div>

                    <div className="space-y-4">
                        {intro.paragraphs.map((text, index) => {
                            const verseAnnotations = annotations.filter(a => a.verseNumber === index)
                            return (
                                <div
                                    id={`index-${index}`}
                                    key={index}
                                    className="group relative"
                                    onMouseUp={() => handleTextSelection(index)}
                                    onTouchEnd={(e) => {
                                        e.preventDefault() // Prevent default touch behavior
                                        handleTextSelection(index)
                                    }}
                                >
                                    <div className="flex gap-2">
                                        {renderIntroText(index, text)}
                                    </div>
                                    {verseAnnotations.length > 0 && (
                                        <div className={`absolute ${isMobile ? "-right-3" : "-right-8"} top-1 flex flex-col gap-1`}>
                                            {verseAnnotations.map((annotation) => (
                                                <Button
                                                    key={annotation._id?.toString()}
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-10 w-10 p-2 text-${annotation.color}-600`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!('ontouchstart' in window)) {
                                                            setAnnotationsOpen(true);
                                                        }
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setAnnotationsOpen(true);
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
                            !isTitlePage ?
                                <Link 
                                    className={buttonVariants({'variant': 'outline'})}
                                    href={`/intro/${encodeURIComponent(lastBook.toLowerCase().replaceAll(' ', '-'))}`}
                                >
                                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                                    Previous Page
                                </Link>
                            :
                            null
                        }
                        {
                            nextIsIntro ?
                            <Link 
                                className={buttonVariants({'variant': 'outline'})}
                                href={`/intro/${encodeURIComponent(nextBook.toLowerCase().replaceAll(' ', '-'))}`}
                            >
                                Next Page
                                <ChevronRightIcon className="h-4 w-4 ml-2" />
                            </Link>
                            :
                            <Link 
                                className={buttonVariants({'variant': 'outline'})}
                                href={`/book/the-first-book-of-nephi/chapter/chapter_1`}
                            >
                                Next
                                <ChevronRightIcon className="h-4 w-4 ml-2" />
                            </Link>
                        }
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
                                    {annotations.sort((a, b) => {
                                        if (a.verseNumber > b.verseNumber) {
                                            return 1
                                        }
                                        else {
                                            return -1
                                        }
                                    }).map((annotation) => (
                                        <Link key={annotation._id?.toString()} href={`/annotation/${annotation._id?.toString()}`}>
                                        <div className="space-y-2 rounded border">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium">Verse {annotation.verseNumber}</span>
                                            </div>
                                            <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color)}`}>
                                                &ldquo;{annotation.highlightedText}&rdquo;
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>
                                            <p className="text-sm">{annotation.userName}</p>
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
                                        </Link>
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
                    <SheetContent className='overflow-y-auto'>
                        <SheetHeader>
                            <SheetTitle>Annotations</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-4">
                            {annotations.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Select text to add annotations.
                                </p>
                            ) : (
                            <div className="space-y-4">
                                {annotations.sort((a, b) => {
                                    if (a.verseNumber > b.verseNumber) {
                                        return 1
                                    }
                                    else {
                                        return -1
                                    }
                                }).map((annotation) => (
                                    <Link key={annotation._id?.toString()} href={`/annotation/${annotation._id?.toString()}`}>
                                        <div className="space-y-2 rounded border">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium">Verse {annotation.verseNumber}</span>
                                            </div>
                                            <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color)}`}>
                                                &ldquo;{annotation.highlightedText}&rdquo;
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>
                                            <p className="text-sm">{annotation.userName}</p>
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
                                    </Link>
                                ))}
                            </div>
                            )}
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
