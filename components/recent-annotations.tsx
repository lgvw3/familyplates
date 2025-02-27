'use client'

import { Annotation, Chapter } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"
import { useCallback, useEffect, useRef, useState } from "react"
import { fetchMoreAnnotations, fetchRecentAnnotations } from "@/lib/annotations/data"
import { VariableSizeList as List } from "react-window";
import { ContinueReading } from "./continue-reading"
import { UserAccount } from "@/lib/auth/definitions"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import Link from "next/link"
import { toast } from "sonner"
import { AnnotationCreation } from "./feed/annotation-creation"


function AnnotationCard({annotation, index, style, user, userMap, currentUserId, bookmark, chapterData, progress, annotationCreated}: {
    annotation: Annotation,
    index: number,
    style: React.CSSProperties,
    user: UserAccount | undefined, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number,
    annotationCreated: () => void
}) {
    // Special handling for the first item (ContinueReading)
    if (index === 0) {
        return (
            <div style={style} className="pb-16 mb-16">
                <div className="py-4 px-4 md:px-8">
                    <ContinueReading bookmark={bookmark} chapterData={chapterData} progress={progress} />
                </div>
                <div className="flex flex-col gap-2 pt-4 px-4 md:px-8">
                    <h2 className="text-2xl font-bold tracking-tight">Recent Annotations & Notes</h2>
                    <p className="text-muted-foreground">See thoughts shared by the fam</p>
                </div>
                <div className="pt-4 pb-2 md:px-8">
                    <AnnotationCreation annotationCreated={annotationCreated} />
                </div>
            </div>
        )
    }
    
    if (user) {
        return (
            <Link 
                style={style} 
                className="md:px-8"
                href={`/annotation/${annotation._id?.toString()}`}
            >
                <AnnotationViewer 
                    index={index}
                    author={user} 
                    annotation={annotation} 
                    userMap={userMap}
                    currentUserId={currentUserId}
                />
            </Link>
        )
    }
    return null
  }


export function RecentAnnotations({recentAnnotations, currentUserId, bookmark, chapterData, progress}: {
    recentAnnotations: Annotation[],
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number
}) {
    const userMap = fetchUsersAsMap()
    const { checkServerHealth, annotations, setAnnotations, addAnnotationsToBottomOfFeed, notification, setNotification } = useWebSocket(recentAnnotations, true) 
    if (notification && notification.userId != currentUserId) {
        toast(`New ${notification.type} by ${notification.userName}`, {position: 'top-center'})
        setNotification(null)
    }
    const isLoading = useRef(false);
    const listRef = useRef<List>(null);

    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
    })

    useEffect(() => {
        const handleResize = () => {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        };

        const healthCheck = async() => {
            const results = await checkServerHealth()
            if (!results) {
                const annotationResults = await fetchRecentAnnotations()
                if (annotationResults) {
                    setAnnotations(annotationResults)
                }
            }
        }
    
        window.addEventListener('resize', handleResize);
        handleResize()
        healthCheck()
    
        // Cleanup the listener on unmount
        return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMoreAnnotations = async () => {
        if (isLoading.current) return;
        isLoading.current = true;

        const newAnnotations = await fetchMoreAnnotations(annotations[annotations.length - 1], 15);
        if (newAnnotations) {
            addAnnotationsToBottomOfFeed(newAnnotations)
        }
        isLoading.current = false;
    };

    const handleScroll = ({scrollDirection, scrollOffset, scrollUpdateWasRequested}: {scrollDirection: string, scrollOffset: number, scrollUpdateWasRequested: boolean}) => {
        if (
            scrollDirection === "forward" && // Scrolling down
            scrollOffset > 0 && // Not at the top
            !scrollUpdateWasRequested && // Prevent infinite loop
            scrollOffset >= (100 * annotations.length) // Threshold to trigger fetch
        ) {
            loadMoreAnnotations();
        }
    };

    const getRowSize = useCallback((index: number) => {
        if (index === 0) return 510 // Height for ContinueReading + section title
        
        const content = annotations[index - 1].text
        const highlightedText = annotations[index - 1].highlightedText;

        const availableWidth = dimensions.width ? Math.ceil(dimensions.width / 10) : 100

        const width = availableWidth > 0 ? availableWidth : 100
        const baseHeight = 200 // Base height for card structure
        const fontSize = 14; // Font size in px
        const lineHeight = fontSize * 1.5; // Line height multiplier
        const highlightedLineHeight = fontSize * 1.6
        const contentLines = Math.ceil(content.length / width);
        const highlightedLines = Math.ceil(highlightedText.length / width);

        if (annotations[index - 1].unboundAnnotation) {
            return baseHeight - 25 + (contentLines * lineHeight)
        }
        else {
            return baseHeight + (contentLines * lineHeight) + (highlightedLines * highlightedLineHeight);
        }
    }, [annotations, dimensions.width])

    const annotationCreated = () => {
        listRef.current?.resetAfterIndex(0);
    }

    useEffect(() => {
        listRef.current?.resetAfterIndex(0);
    }, [dimensions.width]);
    
    return (
        <List
            height={dimensions.height ? dimensions.height - 120 : 600} // Subtract header + navigation height
            itemCount={annotations.length}
            itemSize={getRowSize}
            width="100%"
            className="scrollbar-hide"
            onScroll={handleScroll}
            ref={listRef}
        >
            {({ index, style }) => (
                <AnnotationCard 
                    annotation={index == 0 ? annotations[index] : annotations[index - 1]}
                    index={index}
                    style={style} 
                    user={index == 0 ? undefined : userMap.get(annotations[index - 1].userId)} 
                    userMap={userMap} 
                    currentUserId={currentUserId}
                    bookmark={bookmark}
                    chapterData={chapterData}
                    progress={progress}
                    annotationCreated={annotationCreated}
                />
            )}
        </List>
    )
}

