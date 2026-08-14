'use client'

import { Annotation, Chapter } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"
import { useRef } from "react"
import { fetchMoreAnnotations } from "@/lib/annotations/data"
import { ContinueReading } from "./continue-reading"
import { UserAccount } from "@/lib/auth/definitions"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import Link from "next/link"
import { toast } from "sonner"
import { AnnotationCreation } from "./feed/annotation-creation"
import { Virtuoso } from 'react-virtuoso';


function AnnotationCard({annotation, index, user, userMap, currentUserId, bookmark, chapterData, progress}: {
    annotation: Annotation,
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
    
    if (user) {
        return (
            <Link 
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

    const loadMoreAnnotations = async () => {
        if (isLoading.current) return;
        isLoading.current = true;

        const newAnnotations = await fetchMoreAnnotations(annotations[annotations.length - 1], 15);
        if (newAnnotations) {
            addAnnotationsToBottomOfFeed(newAnnotations)
        }
        isLoading.current = false;
    };

    return (
        <Virtuoso
            style={{ height: '100dvh', width: '100%' }}
            data={annotations} // Pass the annotations array directly
            initialItemCount={annotations.length}
            endReached={loadMoreAnnotations} // Trigger loading more annotations when the user scrolls to the end
            itemContent={(index) => (
                <AnnotationCard
                    annotation={index === 0 ? annotations[index] : annotations[index - 1]}
                    index={index}
                    user={index === 0 ? undefined : userMap.get(annotations[index - 1].userId)}
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
