'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { cn, getInitials, toTitleCase } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, Loader2Icon, MessageCircleIcon, ArrowLeftIcon } from "lucide-react"
import { Button, buttonVariants } from "../ui/button"
import { useEffect, useRef, useState } from "react"
import { Textarea } from "../ui/textarea"
import { addCommentToAnnotation, updateLikeStatusOfComment } from "@/lib/annotations/actions"
import { toast } from "sonner"
import Link from "next/link"
import { fetchUsersAsMap } from "@/lib/auth/accounts"


export default function AnnotationViewerSolo({author, annotation, currentUserId, userName } : {
    author: UserAccount, 
    annotation: Annotation, 
    currentUserId: number,
    userName: string
}) {
    const userMap = fetchUsersAsMap()
    const [commentContent, setCommentContent] = useState('')
    const [savingComment, setSavingComment] = useState(false)
    const [userLike, setUserLike] = useState(annotation.likes?.find(val => val.userId == currentUserId))
    const [addCommentOpen, setAddCommentOpen] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (addCommentOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [addCommentOpen]);

    const saveComment = async() => {
        setSavingComment(true)
        const results = await addCommentToAnnotation(commentContent, annotation._id?.toString() ?? '')
        if (results.newComment) {
            toast.success('Comment shared!')
            setCommentContent('')
            setAddCommentOpen(false)
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
                    userName: userName,
                    timeStamp: new Date()
                }
            }
        })
        const results = await updateLikeStatusOfComment(currentUserId, annotation._id?.toString() ?? '', userLike)
        if (results.newLike) {
            setCommentContent('')
        }
        else {
            toast.warning(results.message as string)
            setUserLike(temp)
        }
    }

    return (
        <div className="mx-4 min-h-lvh mt-4">
            <Card 
                key={annotation._id?.toString()}
                className={`cursor-pointer rounded-b-none`}
            >
                <CardHeader>
                    <div className="flex items-center pb-4">
                        <Link 
                            href={'/'}
                            className={buttonVariants({variant: 'ghost', size: 'icon'})}
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>
                        Annotation
                    </div>
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
                <CardFooter className="flex items-center gap-4 pt-4 border-t-4 border-b">
                    {
                        addCommentOpen ?
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
                                            setAddCommentOpen(false)

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
                                setAddCommentOpen(true)
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
                            <Link 
                                className={cn(buttonVariants({variant: 'ghost', size: 'sm'}), "gap-2")}
                                href={`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumber}`}
                            >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                    <span>View in Context</span>
                            </Link>
                        </>
                    }
                </CardFooter>
            </Card>
            {
                annotation.comments?.map(comment => {
                    const commentAuthor = userMap.get(comment.userId)
                    return (
                        <Card key={comment._id.toString()} className="rounded-none">
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