'use client'

import { useState, useEffect, useRef, JSX } from 'react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, LinkIcon, StickyNoteIcon, MessageSquareIcon, MessageCircleIcon } from 'lucide-react'
import { Annotation, AnnotationType, Book, Chapter, Verse } from '@/types/scripture'
import Image from 'next/image'
import { AnnotationMenu } from './annotation-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'
import Link from 'next/link'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/use-websockets'
import { debounce } from 'lodash';
import { saveBookmark } from '@/lib/reading/action'
import { useHeader } from './header-context'

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

interface ScriptureReaderProps {
  chapter: Chapter,
  book: Book,
  initialAnnotations: Annotation[],
  currentUserId: number,
  chapters: string[],
  nextBook: string | null,
  previousBook: string | null,
  previousBookLastChapter: number
}

const calculateVersePositions = (verses: Verse[]): { start: number; end: number; number: number }[] => {
  let currentPosition = 0;
  return verses.map(verse => {
    const start = currentPosition;
    // Add verse number and space
    currentPosition += verse.number.toString().length + 1;
    // Add verse text and double newline
    currentPosition += verse.text.length + 2;
    return {
      start,
      end: currentPosition,
      number: verse.number
    };
  });
};

export default function ScriptureReader({ chapter, book, initialAnnotations, currentUserId, chapters, nextBook, previousBook, previousBookLastChapter }: ScriptureReaderProps) {
  const chapterNumber = Number(chapter.chapter_title.slice(8))
  const numberOfChaptersInBook = chapters.length;
  const isFirstChapter = chapterNumber == 1;

  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<SelectionInfo | null>(null)
  const [currentVisibleVerse, setCurrentVisibleVerse] = useState(1);
  const { annotations, addAnnotation, notification, setNotification } = useWebSocket(initialAnnotations, false, book.title.toLowerCase().replaceAll(' ', '-'), chapterNumber)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [annotationsOpen, setAnnotationsOpen] = useState(false)
  const [currentAnnotationId, setCurrentAnnotationId] = useState<string | null>(null)
  const { setHeader } = useHeader();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [buttonPositions, setButtonPositions] = useState<{[key: string]: number}>({});
  const positionsRef = useRef<{[key: string]: number}>({});
  //const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort annotations by startIndex to ensure proper rendering order
  const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

  // Update button positions when annotations change
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
          
          // Only update if position has changed significantly
          if (Math.abs((positionsRef.current[annotation._id?.toString() || ''] || 0) - newTop) > 1) {
            newPositions[annotation._id?.toString() || ''] = newTop;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        positionsRef.current = newPositions;
        
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          setButtonPositions(newPositions);
        });
      }
    };

    // Initial position update
    updateButtonPositions();

    // Set up resize observer with debounce
    const debouncedUpdate = debounce(updateButtonPositions, 100);
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Set up scroll listener with debounce
    window.addEventListener('scroll', debouncedUpdate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', debouncedUpdate);
      debouncedUpdate.cancel(); // Cancel any pending debounced calls
    };
  }, [sortedAnnotations]); // Remove elementsReady from dependencies

  if (notification && notification.userId != currentUserId) {
    toast(`New ${notification.type} by ${notification.userName}`, { position: 'top-center' })
    setNotification(null)
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

    //document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleTextSelection = () => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const selectedText = selection.toString();
        
        // Get the range of the selection
        const range = selection.getRangeAt(0);
        
        // Calculate the absolute position in the text
        let startIndex = 0;
        let endIndex = 0;
        
        // Walk through the DOM to find the absolute position
        const walker = document.createTreeWalker(
          document.querySelector('.chapter-text') as Node,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node: Text | null;
        let currentIndex = 0;
        
        while ((node = walker.nextNode() as Text)) {
          const nodeLength = node.length;
          
          if (node === range.startContainer) {
            startIndex = currentIndex + range.startOffset;
          }
          if (node === range.endContainer) {
            endIndex = currentIndex + range.endOffset;
            break;
          }
          
          currentIndex += nodeLength;
        }

        setCurrentSelection({
          text: selectedText,
          startIndex: Math.min(startIndex, endIndex),
          endIndex: Math.max(startIndex, endIndex)
        });
        
        // Show the menu at the bottom
        setMenuPosition({ 
          x: 0, 
          y: 0,
          width: window.innerWidth 
        });
      }
    }, 10);
  };

  const handleAddAnnotation = async (annotationData: Omit<Annotation, '_id' | 'startIndex' | 'endIndex' | 'verseNumbers' | 'createdAt' | 'highlightedText' | 'userId' | 'userName' | 'chapterNumber' | 'bookId' | 'comments' | 'likes'>) => {
    if (currentSelection) {
      // Calculate verse positions
      const versePositions = calculateVersePositions(chapter.verses);
      
      // Find which verses are highlighted
      const highlightedVerses = versePositions.filter(pos => 
        (currentSelection.startIndex >= pos.start && currentSelection.startIndex < pos.end) || // Start is in verse
        (currentSelection.endIndex > pos.start && currentSelection.endIndex <= pos.end) || // End is in verse
        (currentSelection.startIndex <= pos.start && currentSelection.endIndex >= pos.end) // Verse is completely contained
      ).map(pos => pos.number);

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
        bookId: book.title.toLowerCase().replaceAll(' ', '-'),
        chapterNumber: chapterNumber,
        comments: [],
        likes: [],
        verseNumbers: highlightedVerses, // Add the verse numbers
        ...(annotationData.url && { url: annotationData.url }),
        ...(annotationData.photoUrl && { photoUrl: annotationData.photoUrl })
      });
      
      if (results.insertedId) {
        toast.success('Note shared with the family!');
        addAnnotation({
          ...results.annotation,
          _id: results.insertedId,
        });
        setMenuPosition(null);
        setCurrentSelection(null);
        window.getSelection()?.removeAllRanges();
      } else {
        toast.error(`Shoot! ${results.message}`);
      }
    }
  };

  const handleCloseMenu = () => {
    setMenuPosition(null);
    setCurrentSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const isNumber = (char: string) => {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57; // ASCII codes for '0' to '9'
  };

  const renderChapterText = () => {
    // Combine all verses into one text, including verse numbers and proper spacing
    const fullText = chapter.verses.map(verse => 
      `${verse.number} ${verse.text}`
    ).join('\n\n');  // Add double line breaks between verses
  
    
    // Create a map of character positions to their annotation classes
    const annotationMap = new Map<number, { class: string; id: string }>();
    
    // Mark the start and end of each annotation
    sortedAnnotations.forEach(annotation => {
      const highlightClass = getHighlightStyle(annotation.color);
      annotationMap.set(annotation.startIndex, { 
        class: highlightClass, 
        id: annotation._id?.toString() || 'temp'
      });
      annotationMap.set(annotation.endIndex, { class: 'end', id: 'end' });
    });

    // Build the text with annotations
    const elements: JSX.Element[] = [];
    let currentText = '';
    const stack: Array<{ class: string; id: string }> = [];
    let elementKey = 0;

    for (let i = 0; i < fullText.length; i++) {
      const annotationInfo = annotationMap.get(i);

      // Handle annotations
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
          );
          currentText = '';
        }

        if (annotationInfo.class === 'end') {
          stack.pop();
        } else {
          stack.push(annotationInfo);
        }
      }

      // Handle verse numbers
      if (isNumber(fullText[i])) {
        // If we have accumulated text, add it to elements first
        if (currentText) {
          elements.push(
            <span 
              key={`text-${elementKey++}`} 
              className={stack[stack.length - 1]?.class || ''}
              data-annotation-id={stack[stack.length - 1]?.id}
            >
              {currentText}
            </span>
          );
          currentText = '';
        }

        // Collect the verse number
        let verseNumber = fullText[i];
        while (i + 1 < fullText.length && isNumber(fullText[i + 1])) {
          verseNumber += fullText[i + 1];
          i++;
        }

        // Add the verse number span with current annotation class
        elements.push(
          <span 
            key={`verse-number-${elementKey++}`} 
            className={`verse ${stack[stack.length - 1]?.class || ''}`}
            data-verse-id={verseNumber}
            id={`verse-${verseNumber}`}
            data-annotation-id={stack[stack.length - 1]?.id}
          >
            {verseNumber}&nbsp;
          </span>
        );
        i++; // Move past the space after the verse number
        continue;
      }

      currentText += fullText[i];
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
      );
    }

    // Apply temporary highlight if there's a current selection
    if (currentSelection) {
      const tempHighlightClass = 'bg-blue-100 dark:bg-blue-900';
      const selectedText = fullText.substring(currentSelection.startIndex, currentSelection.endIndex);
      let currentRenderIndex = 0;
      return (
        <div className="relative text-container" ref={containerRef}>
          <div 
            className="text-lg leading-relaxed font-serif pr-4 whitespace-pre-line chapter-text"
            onMouseUp={handleTextSelection}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTextSelection();
            }}
          >
            {elements.map((element) => {
              // If this element contains the selection, split it and add the highlight
              if (currentRenderIndex >= currentSelection.startIndex && currentRenderIndex <= currentSelection.endIndex && element.props.children.includes(selectedText)) {
                const text = element.props.children as string;
                const before = text.substring(0, text.indexOf(selectedText));
                const after = text.substring(text.indexOf(selectedText) + selectedText.length);
                
                return (
                  <span key={element.key} className={element.props.className}>
                    {before}
                    <span className={tempHighlightClass}>{selectedText}</span>
                    {after}
                  </span>
                );
              }
              currentRenderIndex += element.props.children.length;
              return element;
            })}
          </div>
          {/* Annotation Icons Column */}
          <div className="absolute right-4 top-0 h-full">
            {sortedAnnotations.map((annotation) => {
              const top = buttonPositions[annotation._id?.toString() || ''];
              if (typeof top === 'undefined') return null;

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
                    e.stopPropagation();
                    if (!('ontouchstart' in window)) {
                      setCurrentAnnotationId(annotation._id!.toString())
                      setAnnotationsOpen(true);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentAnnotationId(annotation._id!.toString())
                    setAnnotationsOpen(true);
                  }}
                >
                  {getAnnotationIcon(annotation.type)}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="relative text-container" ref={containerRef}>
        <div 
          className="text-lg leading-relaxed font-serif pr-4 whitespace-pre-line chapter-text"
          onMouseUp={handleTextSelection}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTextSelection();
          }}
        >
          {elements}
        </div>
        {/* Annotation Icons Column */}
        <div className="absolute right-4 top-0 h-full">
          {sortedAnnotations.map((annotation) => {
            const top = buttonPositions[annotation._id?.toString() || ''];
            if (typeof top === 'undefined') return null;

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
                  e.stopPropagation();
                  if (!('ontouchstart' in window)) {
                    setCurrentAnnotationId(annotation._id!.toString())
                    setAnnotationsOpen(true);
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentAnnotationId(annotation._id!.toString())
                  setAnnotationsOpen(true);
                }}
              >
                {getAnnotationIcon(annotation.type)}
              </Button>
            );
          })}
        </div>
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
            "bg-yellow-100",
            "dark:bg-yellow-900",
            "transition-colors",
            "duration-1000",
            "ease-in-out",
            "opacity-100"
          );

          // Remove the highlight effect after 2 seconds
          setTimeout(() => {
            verseElement.classList.add("opacity-0");
            setTimeout(() => {
              verseElement.classList.remove("bg-yellow-100", "dark:bg-yellow-900", "opacity-0");
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

  const saveLastReadPlace = async (verseNumber: number) => {
    try {
      await saveBookmark({
        _id: null,
        verseNumber: verseNumber,
        bookId: book.title.toLowerCase().replaceAll(' ', '-'),
        chapterNumber: chapterNumber,
        userId: 0,
        lastRead: new Date()
      })
    } catch (error) {
      console.error('Failed to save place:', error);
    }
  };

  const debouncedSavePlace = debounce((verseId: number) => {
    saveLastReadPlace(verseId);
  }, 3000)

  useEffect(() => {
    const verseElements = document.querySelectorAll('.verse'); // Select all verse divs

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Find the most "middle" element
          const middleEntry = visibleEntries.reduce((closest, entry) => {
            const box = entry.target.getBoundingClientRect();
            const middleDistance = Math.abs(window.innerHeight / 2 - (box.top + box.height / 2));

            return middleDistance < closest.distance
              ? { distance: middleDistance, element: entry.target }
              : closest;
          }, { distance: Infinity, element: null as Element | null });

          if (middleEntry.element) {
            const verseId = middleEntry.element.getAttribute('data-verse-id');
            if (verseId) {
              setCurrentVisibleVerse(Number(verseId));
            }
          }
        }
      },
      { threshold: 0.5 } // Consider a div visible if 50% or more is in the viewport
    );

    verseElements.forEach(el => observer.observe(el));

    return () => observer.disconnect(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    // Call the debounced save function whenever the currentVisibleVerse changes
    debouncedSavePlace(currentVisibleVerse);

    // Cleanup debounced function on unmount
    return () => {
      debouncedSavePlace.cancel();
    };
  }, [currentVisibleVerse, debouncedSavePlace]);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setShowStickyHeader(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (showStickyHeader) {
      setHeader(chapter.chapter_title, book.title);
    } else {
      setHeader(undefined, undefined);
    }
  }, [showStickyHeader, chapter.chapter_title, book.title, setHeader]);

  const renderAnnotationPanel = () => {
    if (annotations.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          Select text to add annotations.
        </p>
      );
    }

    // Sort annotations by their position in the text
    const sortedAnnotations = [...annotations].filter(a => currentAnnotationId ? a._id?.toString() === currentAnnotationId : true).sort((a, b) => a.startIndex - b.startIndex);

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
    const handleAnnotationClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute('data-annotation-id')) {
        const annotationId = target.getAttribute('data-annotation-id');
        const annotation = annotations.find(a => a._id?.toString() === annotationId);
        if (annotation) {
          // You can add logic here to show the annotation details or edit menu
          // For example, you could open a modal or navigate to the annotation page
        }
      }
    };

    document.addEventListener('click', handleAnnotationClick);
    return () => document.removeEventListener('click', handleAnnotationClick);
  }, [annotations]);

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
          </BreadcrumbList>
        </Breadcrumb>
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
                    <h3 className="text-lg font-serif">{book.intro}</h3>
                  </>
                )}
              {
                chapter.chapter_heading && (
                  <p className='font-serif'>{chapter.chapter_heading}</p>
                )
              }

              <h4
                ref={headingRef}
                className='text-muted-foreground text-center font-serif'
              >{chapter.chapter_title}</h4>
              <p className="text-muted-foreground font-serif">{chapter.summary}</p>
            </div>

            <div className="space-y-4">
              {renderChapterText()}
            </div>

            {/* Chapter Navigation */}
            <div className="flex justify-between pt-4">
              {
                !isFirstChapter ?
                  <Link
                    className={buttonVariants({ 'variant': 'outline' })}
                    href={`/book/${encodeURIComponent(book.title.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${chapterNumber - 1}`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Previous Chapter
                  </Link>
                  : previousBook ?
                    <Link
                      className={buttonVariants({ 'variant': 'outline' })}
                      href={`/book/${encodeURIComponent(previousBook.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${previousBookLastChapter}`}
                    >
                      <ChevronLeftIcon className="h-4 w-4 ml-2" />
                      Previous Book
                    </Link>
                    :
                    <Link
                      className={buttonVariants({ 'variant': 'outline' })}
                      href={'/intro/brief-explanation-about-the-book-of-mormon'}
                    >
                      <ChevronLeftIcon className="h-4 w-4 ml-2" />
                      Previous
                    </Link>
              }
              {
                numberOfChaptersInBook > chapterNumber ?
                  <Link
                    className={buttonVariants({ 'variant': 'outline' })}
                    href={`/book/${encodeURIComponent(book.title.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_${chapterNumber + 1}`}
                  >
                    Next Chapter
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
                  </Link>
                  : nextBook ?
                    <Link
                      className={buttonVariants({ 'variant': 'outline' })}
                      href={`/book/${encodeURIComponent(nextBook.toLowerCase().replaceAll(' ', '-'))}/chapter/chapter_1`}
                    >
                      Next Book
                      <ChevronRightIcon className="h-4 w-4 ml-2" />
                    </Link>
                    :
                    <>The End</>
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
          <Sheet open={annotationsOpen} onOpenChange={(open) => {
            setAnnotationsOpen(open)
            setCurrentAnnotationId(null)
          }}>
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
                <SheetDescription className='sr-only'>
                  Annotations for this chapter
                </SheetDescription>
              </SheetHeader>
              {renderAnnotationPanel()}
            </SheetContent>
          </Sheet>
        </div>
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
  )
}