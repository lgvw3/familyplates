'use client'

import { useState, useEffect, useRef, JSX } from 'react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, LinkIcon, StickyNoteIcon, MessageSquareIcon, MessageCircleIcon } from 'lucide-react'
import { Annotation, AnnotationType, Intro } from '@/types/scripture'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import Link from 'next/link'
import { introMaterialOrder } from './navigation'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/use-websockets'
import { debounce } from 'lodash'

interface SelectionInfo {
    text: string;
    startIndex: number;
    endIndex: number;
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
    //const [currentVerseNumber, setCurrentVerseNumber] = useState<number | null>(null)
    const { annotations, addAnnotation, notification, setNotification } = useWebSocket(initialAnnotations, false, intro.title.replace(' ', '-').toLowerCase(), 1)
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [annotationsOpen, setAnnotationsOpen] = useState(false)
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

    const [buttonPositions, setButtonPositions] = useState<{[key: string]: number}>({})
    const positionsRef = useRef<{[key: string]: number}>({})
    const containerRef = useRef<HTMLDivElement>(null)
    const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex)

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

    const handleTextSelection = () => {
        if (selectionTimeoutRef.current) {
            clearTimeout(selectionTimeoutRef.current)
        }
        
        selectionTimeoutRef.current = setTimeout(() => {
            const selection = window.getSelection()
            if (selection && selection.toString().length > 0) {
                const selectedText = selection.toString()
                
                // Get the range of the selection
                const range = selection.getRangeAt(0)
                
                // Calculate the absolute position in the text
                let startIndex = 0
                let endIndex = 0
                
                // Walk through the DOM to find the absolute position
                const walker = document.createTreeWalker(
                    document.querySelector('.text-lg') as Node,
                    NodeFilter.SHOW_TEXT,
                    null
                )
                
                let node: Text | null
                let currentIndex = 0
                
                while ((node = walker.nextNode() as Text)) {
                    const nodeLength = node.length
                    
                    if (node === range.startContainer) {
                        startIndex = currentIndex + range.startOffset
                    }
                    if (node === range.endContainer) {
                        endIndex = currentIndex + range.endOffset
                        break
                    }
                    
                    currentIndex += nodeLength
                }

                setCurrentSelection({
                    text: selectedText,
                    startIndex: Math.min(startIndex, endIndex),
                    endIndex: Math.max(startIndex, endIndex)
                })
                
                setMenuPosition({ 
                    x: 0, 
                    y: 0,
                    width: window.innerWidth 
                })
            }
        }, 10)
    }

    const handleAddAnnotation = async (annotationData: Omit<Annotation, '_id' | 'startIndex' | 'endIndex' | 'verseNumbers' | 'chapterNumber' | 'createdAt' | 'highlightedText' | 'userId' | 'userName' | 'bookId' | 'comments' | 'likes'>) => {
        if (currentSelection) {
            const results = await saveAnnotation({
                _id: null,
                startIndex: currentSelection.startIndex,
                endIndex: currentSelection.endIndex,
                text: annotationData.text,
                highlightedText: currentSelection.text,
                type: annotationData.type,
                color: annotationData.color,
                createdAt: new Date(),
                userId: 0,
                userName: '',
                bookId: intro.title.toLowerCase().replaceAll(' ', '-'),
                comments: [],
                likes: [],
                ...(annotationData.url && { url: annotationData.url }),
                ...(annotationData.photoUrl && { photoUrl: annotationData.photoUrl }),
                verseNumbers: [],
                chapterNumber: 0
            })
            
            if (results.insertedId) {
                toast.success('Note shared with the family!')
                addAnnotation({
                    ...results.annotation,
                    _id: results.insertedId,
                })
                setMenuPosition(null)
                setCurrentSelection(null)
                window.getSelection()?.removeAllRanges()
            } else {
                toast.error(`Shoot! ${results.message}`)
            }
        }
    }

    const handleCloseMenu = () => {
        setMenuPosition(null)
        setCurrentSelection(null)
        window.getSelection()?.removeAllRanges()
    }

    const renderIntroText = () => {
        // Combine all paragraphs into one text with proper spacing
        const fullText = intro.paragraphs.join('\n\n')
        
        // Create a map of character positions to their annotation classes
        const annotationMap = new Map<number, { class: string; id: string }>()
        
        // Mark the start and end of each annotation
        sortedAnnotations.forEach(annotation => {
            const highlightClass = getHighlightStyle(annotation.color)
            annotationMap.set(annotation.startIndex, { 
                class: highlightClass, 
                id: annotation._id?.toString() || 'temp'
            })
            annotationMap.set(annotation.endIndex, { class: 'end', id: 'end' })
        })

        // Build the text with annotations
        const elements: JSX.Element[] = []
        let currentText = ''
        const stack: Array<{ class: string; id: string }> = []
        let elementKey = 0

        for (let i = 0; i < fullText.length; i++) {
            const annotationInfo = annotationMap.get(i)
            
            if (annotationInfo) {
                if (currentText) {
                    elements.push(
                        <span 
                            key={`text-${elementKey++}`} 
                            className={stack[stack.length - 1]?.class || ''}
                            data-annotation-id={stack[stack.length - 1]?.id}
                        >
                            {currentText}
                        </span>
                    )
                    currentText = ''
                }

                if (annotationInfo.class === 'end') {
                    stack.pop()
                } else {
                    stack.push(annotationInfo)
                }
            }

            currentText += fullText[i]
        }

        // Add any remaining text
        if (currentText) {
            elements.push(
                <span 
                    key={`text-${elementKey++}`} 
                    className={stack[stack.length - 1]?.class || ''}
                    data-annotation-id={stack[stack.length - 1]?.id}
                >
                    {currentText}
                </span>
            )
        }

        return (
            <div className="relative text-container">
                <div 
                    className="text-lg leading-relaxed font-serif pr-4 whitespace-pre-line"
                    onMouseUp={handleTextSelection}
                    onTouchEnd={(e) => {
                        e.preventDefault()
                        handleTextSelection()
                    }}
                >
                    {elements}
                </div>
                {/* Annotation Icons Column */}
                <div className="absolute right-4 top-0 h-full">
                    {sortedAnnotations.map((annotation) => {
                        const top = buttonPositions[annotation._id?.toString() || '']
                        if (typeof top === 'undefined') return null

                        return (
                            <Button
                                key={annotation._id?.toString()}
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 p-1 text-${annotation.color}-600 absolute`}
                                style={{ 
                                    top: `${top}px`,
                                    transform: 'translateY(-50%)'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!('ontouchstart' in window)) {
                                        setAnnotationsOpen(true)
                                    }
                                }}
                                onTouchStart={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setAnnotationsOpen(true)
                                }}
                            >
                                {getAnnotationIcon(annotation.type)}
                            </Button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderAnnotationPanel = () => {
        if (annotations.length === 0) {
            return (
                <p className="text-muted-foreground text-sm">
                    Select text to add annotations.
                </p>
            );
        }

        return (
            <div className="space-y-4">
                {sortedAnnotations.map((annotation) => (
                    <Link
                        key={annotation._id?.toString()}
                        href={`/annotation/${annotation._id?.toString()}`}
                    >
                        <div className="space-y-2 rounded border p-3 hover:bg-accent/50 transition-colors">
                            <p className={`text-sm p-2 rounded ${getHighlightStyle(annotation.color)}`}>
                                &ldquo;{annotation.highlightedText}&rdquo;
                            </p>
                            {annotation.text && (
                                <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{annotation.userName}</span>
                                <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm flex gap-2">
                                {annotation.comments.length > 0 && (
                                    <span className="flex items-center gap-1 mx-2">
                                        <MessageCircleIcon className="h-4 w-4" /> {annotation.comments.length}
                                    </span>
                                )}
                            </p>
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
        );
    };

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

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        const updateButtonPositions = () => {
            const newPositions: {[key: string]: number} = {};
            let hasChanges = false;
            
            sortedAnnotations.forEach(annotation => {
                const textElement = document.querySelector(`[data-annotation-id="${annotation._id}"]`);
                if (textElement && containerRef.current) {
                    const rect = textElement.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const newTop = rect.top - containerRect.top;
                    
                    if (Math.abs((positionsRef.current[annotation._id?.toString() || ''] || 0) - newTop) > 1) {
                        newPositions[annotation._id?.toString() || ''] = newTop;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                positionsRef.current = newPositions;
                requestAnimationFrame(() => {
                    setButtonPositions(newPositions);
                });
            }
        };

        updateButtonPositions();

        const debouncedUpdate = debounce(updateButtonPositions, 100);
        const resizeObserver = new ResizeObserver(debouncedUpdate);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('scroll', debouncedUpdate);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('scroll', debouncedUpdate);
            debouncedUpdate.cancel();
        };
    }, [sortedAnnotations]);

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
                        {renderIntroText()}
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
                        {renderAnnotationPanel()}
                    </div>
                </div>

                {/* Annotations Panel */}
                <Sheet open={annotationsOpen} onOpenChange={setAnnotationsOpen}>
                    <Button
                        variant="outline"
                        className="w-full md:hidden mb-4"
                        onClick={() => setAnnotationsOpen(true)}
                    >
                        View Annotations
                    </Button>
                    <SheetContent className='overflow-y-auto'>
                        <SheetHeader>
                            <SheetTitle>Annotations</SheetTitle>
                        </SheetHeader>
                        {renderAnnotationPanel()}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Annotation Menu */}
            <div id="annotation-menu">
                <AnnotationMenu
                    position={menuPosition}
                    onSave={handleAddAnnotation}
                    onClose={handleCloseMenu}
                />
            </div>
        </div>
    </div>
    )
}
