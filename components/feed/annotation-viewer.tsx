'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { cn, getInitials, toTitleCase } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import { updateLikeStatusOfComment } from "@/lib/annotations/actions"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { motion } from "framer-motion"


export default function AnnotationViewer({ index, author, annotation, userMap, currentUserId } : {
    index?: number, 
    author: UserAccount, 
    annotation: Annotation, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
}) {
    const [userLike, setUserLike] = useState(annotation.likes.find(val => val.userId == currentUserId))
    const router = useRouter()

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
        const results = await updateLikeStatusOfComment(currentUserId, annotation._id?.toString() ?? '', userLike)
        if (!results.newLike) {
            toast.warning(results.message as string)
            setUserLike(temp)
        }
    }

    const getBackgroundColor = () => {
        switch (annotation.color) {
            case 'yellow':
                return 'bg-yellow-300 dark:bg-yellow-800';
            case 'blue':
                return 'bg-blue-300 dark:bg-blue-800';
            case 'green':
                return 'bg-green-300 dark:bg-green-800';
            case 'blue':
                return 'bg-blue-300 dark:bg-blue-800'
            case 'purple':
                return 'bg-purple-300 dark:bg-purple-800'
            default:
                return '';
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
                className={`cursor-pointer ${index == 0 ? 'rounded-b-none' : 'rounded-none'}`}
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
                                    !annotation.unboundAnnotation ?
                                    <>on {`${toTitleCase(annotation.bookId.replaceAll('-', ' '))} ${annotation.chapterNumber}:${annotation.verseNumbers[0]}${(annotation.verseNumbers.length > 1 ? `-${annotation.verseNumbers[annotation.verseNumbers.length - 1]}` : '')}`} • </> 
                                    : null
                                }
                                {getPostDate()}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {
                        !annotation.unboundAnnotation ?
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <div className="flex-1 space-y-1">
                                <span className={cn(getBackgroundColor(), 'rounded p-1 text-sm font-medium leading-none')}>
                                    {annotation.highlightedText}
                                </span>
                            </div>
                        </div>
                        : null 
                    }
                    <p className="text-foreground whitespace-pre-wrap">{annotation.text}</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2">
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
                            { annotation.likes.length ?? null }
                        </Button>
                    </motion.div>
                    {
                        !annotation.unboundAnnotation ?
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    router.push(`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumbers[0]}`)
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