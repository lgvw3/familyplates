'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { getInitials, toTitleCase } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, Loader2Icon, MessageCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Textarea } from "../ui/textarea"
import { addCommentToAnnotation, updateLikeStatusOfComment } from "@/lib/annotations/actions"
import { toast } from "sonner"

export default function AnnotationViewer({index, author, annotation, userMap, currentUserId} : {index: number, author: UserAccount, annotation: Annotation, userMap: Map<number, UserAccount>, currentUserId: number}) {
    const [showComments, setShowComments] = useState(false)
    const [addingComment, setAddingComment] = useState(false)
    const [commentContent, setCommentContent] = useState('')
    const [savingComment, setSavingComment] = useState(false)
    const [userLike, setUserLike] = useState(annotation.likes?.find(val => val.userId == currentUserId))

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (addingComment && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [addingComment]);

    const saveComment = async() => {
        setSavingComment(true)
        const results = await addCommentToAnnotation(commentContent, annotation._id?.toString() ?? '')
        if (results.newComment) {
            toast.success('Comment shared!')
            setAddingComment(false)
            setCommentContent('')
        }
        else {
            toast.warning(results.message as string)
        }
        setSavingComment(false)
    }

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
        if (results.newLike) {
            setAddingComment(false)
            setCommentContent('')
        }
        else {
            toast.warning(results.message as string)
            setUserLike(temp)
        }
    }

    return (
        <div>
        <Card 
            key={annotation._id?.toString()} 
            onClick={() => setShowComments(!showComments)}
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
                {
                    addingComment ?
                        <div className="flex flex-col w-full">
                            <Textarea 
                                placeholder="Share your thoughts" 
                                onChange={(e) => setCommentContent(e.target.value)} 
                                ref={textareaRef}
                            />
                            <div>
                                <Button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        saveComment()
                                    }}
                                    disabled={!commentContent.length || savingComment}
                                    className="max-w-32"
                                >
                                    { savingComment ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Post Comment" }
                                </Button>
                                <Button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setAddingComment(false)
                                    }}
                                    disabled={savingComment}
                                    className="max-w-32"
                                    variant={'ghost'}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    :
                    <>
                        <Button variant="ghost" size="sm" className="gap-2" onClick={(e) => {
                            e.stopPropagation()
                            setAddingComment(true)
                        }}>
                            <MessageCircleIcon className="h-4 w-4" /> { annotation.comments?.length ?? null }
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={(e) => {
                                e.stopPropagation()
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
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                            <Link 
                                href={`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumber}`}
                            >
                                <ExternalLinkIcon className="h-4 w-4" />
                                <span>View in Context</span>
                            </Link>
                        </Button>
                    </>
                }
            </CardFooter>
        </Card>
        {
            showComments && annotation.comments?.map(comment => {
                const commentAuthor = userMap.get(comment.userId)
                return (
                    <Card key={comment._id.toString()} className="mx-4 rounded-none">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={commentAuthor?.avatar} alt={commentAuthor?.name} />
                                    <AvatarFallback>{getInitials(commentAuthor?.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{comment.userName}</CardTitle>
                                    <CardDescription>
                                        {comment.timeStamp.toLocaleString()}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground">{comment.content}</p>
                        </CardContent>
                    </Card>
                )
            })
        }
        </div>
    )
}