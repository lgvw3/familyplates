'use client'

import { Annotation } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"
import { useEffect, useRef, useState } from "react"
import { fetchMoreAnnotations } from "@/lib/annotations/data"
import { ContinueReading } from "./continue-reading"
import { UserAccount } from "@/lib/auth/definitions"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import { toast } from "sonner"
import { AnnotationCreation } from "./feed/annotation-creation"
import { Virtuoso } from 'react-virtuoso';
import { motion } from "framer-motion"
import { PlusIcon } from "lucide-react"
import { Button } from "./ui/button"


function AnnotationCard({annotation, index, user, userMap, currentUserId}: {
    annotation: Annotation,
    index: number,
    user: UserAccount | undefined, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
}) {
    if (user) {
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


export function RecentAnnotations({ currentUserId, bookmark, recentAnnotations }: {
    currentUserId: number,
    bookmark: BookmarkedSpot | null,
    recentAnnotations: Annotation[] | null,
}) {
    const userMap = fetchUsersAsMap()
    const { annotations, addAnnotationsToBottomOfFeed, notification, setNotification } = useWebSocket(recentAnnotations ?? [], true)
    if (notification && notification.userId != currentUserId) {
        toast(`New ${notification.type} by ${notification.userName}`, {position: 'top-center'})
        setNotification(null)
    }
    const isLoading = useRef(false);
    const [scroller, setScroller] = useState<HTMLElement | Window | null>(null)
    const [actionsVisible, setActionsVisible] = useState(true)
    const lastScrollTop = useRef(0)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        if (!scroller) return

        const getScrollTop = () => 'scrollY' in scroller ? scroller.scrollY : scroller.scrollTop
        lastScrollTop.current = getScrollTop()

        const handleScroll = () => {
            const currentScrollTop = getScrollTop()
            const delta = currentScrollTop - lastScrollTop.current

            if (Math.abs(delta) < 4) return

            setActionsVisible(delta < 0 || currentScrollTop <= 0)
            lastScrollTop.current = currentScrollTop
        }

        scroller.addEventListener('scroll', handleScroll, { passive: true })
        return () => scroller.removeEventListener('scroll', handleScroll)
    }, [scroller])

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
        <>
            <Virtuoso
                style={{ width: '100%' }}
                data={annotations}
                scrollerRef={setScroller}
                useWindowScroll
                endReached={loadMoreAnnotations}
                itemContent={(index, item) => (
                    <AnnotationCard
                        annotation={item}
                        index={index}
                        user={userMap.get(item.userId)}
                        userMap={userMap}
                        currentUserId={currentUserId}
                    />
                )}
                className="scrollbar-hide"
            />
            <motion.div
                animate={{ opacity: actionsVisible ? 1 : 0, y: actionsVisible ? 0 : 24 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
                style={{ pointerEvents: actionsVisible ? 'auto' : 'none' }}
            >
                <AnnotationCreation
                    renderTrigger={(onOpen) => (
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="size-14 rounded-full shadow-lg shadow-black/25 transition-none hover:bg-secondary hover:text-secondary-foreground"
                            aria-label="Create an unbound annotation"
                            title="Create an unbound annotation"
                            onClick={onOpen}
                        >
                            <PlusIcon className="size-7" />
                        </Button>
                    )}
                />
                <ContinueReading bookmark={bookmark} />
            </motion.div>
        </>
    )
}
