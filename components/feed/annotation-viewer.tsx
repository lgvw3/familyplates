'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { getInitials } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { getAnnotationReference, getTargetHref } from "@/lib/annotations/presentation"
import { AnnotationQuote } from "./annotation-quote"
import { cn } from "@/lib/utils"
import { useAnnotation, useSetAnnotationLiked } from "@/lib/annotations/query"


export default function AnnotationViewer({ index, author, annotation: initialAnnotation, userMap, currentUserId, annotationHref, flat = false, threaded = false } : {
    index?: number, 
    author: UserAccount, 
    annotation: Annotation, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    annotationHref: string,
    flat?: boolean,
    threaded?: boolean,
}) {
    const annotation = useAnnotation(initialAnnotation)
    const annotationId = annotation._id?.toString() ?? ''
    const userLike = annotation.likes.find(val => val.userId === currentUserId)
    const setLiked = useSetAnnotationLiked(annotationId, currentUserId, userMap.get(currentUserId)?.name ?? '')
    const router = useRouter()
    const reference = getAnnotationReference(annotation)

    const saveLike = () => setLiked.mutate(!userLike, { onError: error => toast.warning(error.message) })

    function getHourDifference(date1: Date, date2: Date): number {
        const diffInMs = Math.abs(date1.getTime() - date2.getTime());
      
        return diffInMs / 3600000
    }

    function getMinuteDifference(date1: Date, date2: Date): number {
        const diffInMs = Math.abs(date1.getTime() - date2.getTime());
      
        return diffInMs / (1000 * 60);
    }

    function formatDateToShortString(date: Date): string {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
      }

    const getPostDate = (): string => {
        const now = new Date()
        const date = new Date(annotation.createdAt)
        const hourDiff = Math.floor(getHourDifference(date, now))
        if (now.getFullYear() != date.getFullYear()) {
            return `${formatDateToShortString(date)}, ${date.getFullYear()}`
        }
        else if (hourDiff > 24) {
            return formatDateToShortString(date)
        }
        else if (hourDiff < 1) {
            return `${Math.floor(getMinuteDifference(now, date))}m`
        }
        else {
            return `${hourDiff}h`
        }
    }

    return (
        <>
            <Card 
                key={annotation._id?.toString()}
                className={cn(
                    'cursor-pointer',
                    flat
                        ? 'rounded-none border-0 border-b border-border/70 bg-transparent shadow-none transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 last:border-b-0'
                        : 'rounded-none',
                    !flat && index === 0 && 'border-t-0',
                    threaded && 'border-b-0',
                )}
                onClick={(event) => {
                    if ((event.target as HTMLElement).closest('a, button, input, textarea, select, label')) return
                    router.push(annotationHref)
                }}
            >
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={author?.avatar} alt={author?.name} />
                            <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-base">{annotation.userName}</CardTitle>
                            <CardDescription>
                                {
                                    reference ?
                                    <>on {reference} • </>
                                    : null
                                }
                                {getPostDate()}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className={cn("text-foreground whitespace-pre-wrap", annotation.target && "mb-4")}>{annotation.text}</p>
                    {annotation.target && <AnnotationQuote annotation={annotation} variant="feed" />}
                </CardContent>
                <CardFooter className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={(event) => {
                        event.stopPropagation()
                        router.push(annotationHref)
                    }}>
                        <MessageCircleIcon className="h-4 w-4" /> { annotation.comments.length ?? null }
                    </Button>
                    <motion.div whileTap={{ scale: 0.8 }}>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                saveLike()
                            }}
                        >
                            {
                                userLike ?
                                    <HeartIcon className="h-4 w-4 fill-red-500 stroke-red-500" color="red" />
                                : 
                                    <HeartIcon className="h-4 w-4" />
                            }
                            { annotation.likes.length || null }
                        </Button>
                    </motion.div>
                    {
                        annotation.target ?
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    router.push(getTargetHref(annotation.target!))
                                }}
                            >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                    <span>View in Context</span>
                            </Button>
                        :
                            null
                    }
                </CardFooter>
            </Card>
        </>
    )
}
