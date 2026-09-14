'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { getInitials } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import { updateLikeStatusOfAnnotation } from "@/lib/annotations/actions"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { motion } from "framer-motion"
import { getAnnotationReference, getTargetHref } from "@/lib/annotations/presentation"
import { AnnotationQuote } from "./annotation-quote"
import { cn } from "@/lib/utils"
import Link from 'next/link'


export default function AnnotationViewer({ index, author, annotation, userMap, currentUserId, annotationHref, flat = false, threaded = false } : {
    index?: number, 
    author: UserAccount, 
    annotation: Annotation, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
    annotationHref: string,
    flat?: boolean,
    threaded?: boolean,
}) {
    const [userLike, setUserLike] = useState(annotation.likes.find(val => val.userId == currentUserId))
    const [likeCount, setLikeCount] = useState(annotation.likes.length)
    const router = useRouter()
    const reference = getAnnotationReference(annotation)

    const saveLike = async() => {
        const temp = userLike ? {...userLike} : userLike
        setUserLike((prev) => { // optimistic set for perceived speed
            if (prev) {
                //likes: unlike
                return undefined
            }
            else {
                //no like: likes
                return {
                    _id: "",
                    userId: currentUserId,
                    userName: userMap.get(currentUserId)?.name ?? '',
                    timeStamp: new Date()
                }
            }
        })
        setLikeCount(count => Math.max(0, count + (userLike ? -1 : 1)))
        const results = await updateLikeStatusOfAnnotation(annotation._id?.toString() ?? '')
        if (results.message !== 'Success') {
            toast.warning(results.message as string)
            setUserLike(temp)
            setLikeCount(annotation.likes.length)
        }
    }

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
                        <Link href={`/family/${author.id}`} aria-label={`View ${author.name}'s profile`}>
                            <Avatar>
                                <AvatarImage src={author?.avatar} alt={author?.name} className="object-cover" />
                                <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-1">
                            <CardTitle className="text-base">
                                <Link href={`/family/${author.id}`} className="hover:underline">{annotation.userName}</Link>
                            </CardTitle>
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
                            { likeCount || null }
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
