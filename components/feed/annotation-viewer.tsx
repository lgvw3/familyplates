'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { getInitials, toTitleCase } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import { updateLikeStatusOfComment } from "@/lib/annotations/actions"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { useState } from "react"


export default function AnnotationViewer({ index, author, annotation, userMap, currentUserId } : {
    index?: number, 
    author: UserAccount, 
    annotation: Annotation, 
    userMap: Map<number, UserAccount>, 
    currentUserId: number,
}) {
    const [userLike, setUserLike] = useState(annotation.likes?.find(val => val.userId == currentUserId))
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
                                on {`${toTitleCase(annotation.bookId.replaceAll('-', ' '))} ${annotation.chapterNumber}:${annotation.verseNumber}`} • {new Date(annotation.createdAt).toLocaleTimeString()}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground">{annotation.text}</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircleIcon className="h-4 w-4" /> { annotation.comments?.length ?? null }
                    </Button>
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
                        { annotation.likes?.length ?? null }
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumber}`)
                        }}
                    >
                            <ExternalLinkIcon className="h-4 w-4" />
                            <span>View in Context</span>
                    </Button>
                </CardFooter>
            </Card>
        </>
    )
}