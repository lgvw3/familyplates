'use client'

import { Annotation, Chapter } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"
import { useCallback, useEffect, useRef, useState } from "react"
import { fetchMoreAnnotations } from "@/lib/annotations/data"
import { VariableSizeList as List } from "react-window";
import { ContinueReading } from "./continue-reading"
import { UserAccount } from "@/lib/auth/definitions"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import Link from "next/link"
import { toast } from "sonner"


function AnnotationCard({annotation, index, style, user, userMap, currentUserId, bookmark, chapterData, progress}: {
    annotation: Annotation,
    index: number,
    style: React.CSSProperties,
    user: UserAccount | undefined, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number
}) {
    // Special handling for the first item (ContinueReading)
    if (index === 0) {
        return (
            <div style={style} className="px-4 md:px-8 pb-16 mb-16">
                <div className="py-4">
                    <ContinueReading bookmark={bookmark} chapterData={chapterData} progress={progress} />
                </div>
                <div className="flex flex-col gap-2 pt-4 pb-8">
                    <h2 className="text-2xl font-bold tracking-tight">Recent Annotations & Notes</h2>
                    <p className="text-muted-foreground">See thoughts shared by the fam</p>
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
    const { annotations, addAnnotationsToBottomOfFeed, notification, setNotification } = useWebSocket(recentAnnotations, true) 
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

        const healthCheckForWebSocketServer = async () => {
            const results = await fetch(`${process.env.NEXT_PUBLIC_WEB_SOCKET_URL}/health`)
            if (results) {
                console.log('WSS Server health check good')
            }
        }
    
        window.addEventListener('resize', handleResize);
        handleResize()
        healthCheckForWebSocketServer()
    
        // Cleanup the listener on unmount
        return () => window.removeEventListener('resize', handleResize);
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
        if (index === 0) return 350 // Height for ContinueReading + section title
        
        const content = annotations[index - 1].text
        const highlightedText = annotations[index - 1].highlightedText;

        const availableWidth = dimensions.width ? Math.ceil(dimensions.width / 10) : 100

        const width = availableWidth > 0 ? availableWidth : 100
        const baseHeight = 200 // Base height for card structure
        const fontSize = 14; // Font size in px
        const lineHeight = fontSize * 1.5; // Line height multiplier
        const highlightedLineHeight = fontSize * 1.6
        const contentLines = Math.ceil(content.length / width);
        const highlightedLines = Math.ceil(highlightedText.length / (width - 4));
        
        return baseHeight + (contentLines * lineHeight) + (highlightedLines * highlightedLineHeight);
    }, [annotations, dimensions.width])

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
                />
            )}
        </List>
    )
}

