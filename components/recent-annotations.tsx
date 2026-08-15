'use client'

import { Annotation, Chapter } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"
import { useRef, useState } from "react"
import { fetchMoreAnnotations } from "@/lib/annotations/data"
import { ContinueReading } from "./continue-reading"
import { UserAccount } from "@/lib/auth/definitions"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import { toast } from "sonner"
import { AnnotationCreation } from "./feed/annotation-creation"
import { Virtuoso } from 'react-virtuoso';


function AnnotationCard({annotation, index, user, userMap, currentUserId, bookmark, chapterData, progress}: {
    annotation: Annotation | null,
    index: number,
    //style: React.CSSProperties,
    user: UserAccount | undefined, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number,
}) {
    // Special handling for the first item (ContinueReading)
    if (index === 0) {
        return (
            <>
                <div className="py-4 px-4 md:px-8">
                    <ContinueReading bookmark={bookmark} chapterData={chapterData} progress={progress} />
                </div>
                <div className="flex flex-col gap-2 pt-4 px-4 md:px-8">
                    <h2 className="text-2xl font-bold tracking-tight">Recent Annotations & Notes</h2>
                    <p className="text-muted-foreground">See thoughts shared by the fam</p>
                </div>
                <div className="pt-4 md:px-8">
                    <AnnotationCreation />
                </div>
            </>
        )
    }
    
    if (user && annotation) {
        return (
            <div className="md:px-8">
                <AnnotationViewer 
                    index={index}
                    author={user} 
                    annotation={annotation} 
                    userMap={userMap}
                    currentUserId={currentUserId}
                    annotationHref={`/annotation/${annotation._id?.toString()}`}
                />
            </div>
        )
    }
    return null
  }


export function RecentAnnotations({ currentUserId, bookmark, chapterData, progress, recentAnnotations }: {
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number,
    recentAnnotations: Annotation[] | null,
}) {
    const userMap = fetchUsersAsMap()
    const { annotations, addAnnotationsToBottomOfFeed, notification, setNotification } = useWebSocket(recentAnnotations ?? [], true)
    if (notification && notification.userId != currentUserId) {
        toast(`New ${notification.type} by ${notification.userName}`, {position: 'top-center'})
        setNotification(null)
    }
    const isLoading = useRef(false);
    const [hasMore, setHasMore] = useState(true)
    const feedItems: Array<Annotation | null> = [null, ...annotations]

    const loadMoreAnnotations = async () => {
        if (isLoading.current || !hasMore || annotations.length === 0) return;
        isLoading.current = true;

        try {
            const newAnnotations = await fetchMoreAnnotations(annotations[annotations.length - 1], 15);
            if (newAnnotations === null) {
                return
            }

            if (newAnnotations.length) {
                addAnnotationsToBottomOfFeed(newAnnotations)
            } else {
                setHasMore(false)
            }
        } finally {
            isLoading.current = false;
        }
    };

    return (
        <Virtuoso
            style={{ height: '100dvh', width: '100%' }}
            data={feedItems}
            endReached={loadMoreAnnotations} // Trigger loading more annotations when the user scrolls to the end
            itemContent={(index, item) => (
                <AnnotationCard
                    annotation={item}
                    index={index}
                    user={index === 0 || !item ? undefined : userMap.get(item.userId)}
                    userMap={userMap}
                    currentUserId={currentUserId}
                    bookmark={bookmark}
                    chapterData={chapterData}
                    progress={progress}
                />
            )}
            className="scrollbar-hide"
        />
    )
}
