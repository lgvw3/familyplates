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


function AnnotationCard({annotation, index, style, user, userMap, currentUserId, bookmark, chapterData, progress}: {
    annotation: Annotation,
    index: number,
    style: React.CSSProperties,
    user: UserAccount | undefined, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null,
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
            <div style={style} className="px-4 md:px-8">
                <AnnotationViewer 
                    index={index}
                    author={user} 
                    annotation={annotation} 
                    userMap={userMap}
                    currentUserId={currentUserId}
                />
            </div>
        )
    }
    return null
  }


export function RecentAnnotations({recentAnnotations, currentUserId, bookmark, chapterData, progress}: {
    recentAnnotations: Annotation[],
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null,
    progress: number
}) {
    const userMap = fetchUsersAsMap()
    const { annotations, addAnnotationsToBottomOfFeed } = useWebSocket(recentAnnotations, true) 
    const feedRef = useRef(null);
    const isLoading = useRef(false);

    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
    })

    useEffect(() => {
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
        })
    }, [])

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
        const baseHeight = 200 // Base height for card structure
        const contentLines = Math.ceil(content.length / 50) // Rough estimate of lines
        return baseHeight + contentLines * 20 // Add height for content
    }, [annotations])
    
    return (
        <div ref={feedRef}>
            <List
                height={dimensions.height - 120} // Subtract header + navigation height
                itemCount={annotations.length} // +1 for ContinueReading
                itemSize={getRowSize}
                width="100%"
                className="scrollbar-hide"
                onScroll={handleScroll}
            >
                {({ index, style }) => (
                    <AnnotationCard 
                        annotation={annotations[index]}
                        index={index}
                        style={style} 
                        user={userMap.get(annotations[index].userId)} 
                        userMap={userMap} 
                        currentUserId={currentUserId}
                        bookmark={bookmark}
                        chapterData={chapterData}
                        progress={progress}
                    />
                )}
            </List>
        </div>
    )
}

