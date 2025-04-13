'use client'

import { UserAccount } from "@/lib/auth/definitions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Annotation } from "@/types/scripture"
import { cn, getInitials, toTitleCase } from "@/lib/utils"
import { HeartIcon, ExternalLinkIcon, Loader2Icon, MessageCircleIcon, ArrowLeftIcon, Edit3Icon, LoaderCircleIcon } from "lucide-react"
import { Button, buttonVariants } from "../ui/button"
import { useEffect, useRef, useState } from "react"
import { AutoResizeTextarea } from "../ui/auto-resize-textarea"
import { addCommentToAnnotation, updateAnnotation, updateLikeStatusOfComment } from "@/lib/annotations/actions"
import { toast } from "sonner"
import Link from "next/link"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import { motion } from "framer-motion"


export default function AnnotationViewerSolo({author, initialAnnotation, currentUserId, userName } : {
    author: UserAccount, 
    initialAnnotation: Annotation, 
    currentUserId: number,
    userName: string
}) {

    const { annotations, setAnnotations, notification, setNotification } = useWebSocket([initialAnnotation], false) 
    const annotation = annotations[0]
    const userMap = fetchUsersAsMap()
    const [commentContent, setCommentContent] = useState('')
    const [savingComment, setSavingComment] = useState(false)
    const [userLike, setUserLike] = useState(annotation.likes?.find(val => val.userId == currentUserId))
    const [addCommentOpen, setAddCommentOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editedVersion, setEditedVersion] = useState('')
    const [editSaving, setEditSaving] = useState(false)

    if (notification && notification.userId != currentUserId) {
        toast(`New ${notification.type} by ${notification.userName}`, {position: 'top-center'})
        setNotification(null)
    }

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (addCommentOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [addCommentOpen]);

    const saveEditOfAnnotation = async () => {
        setEditSaving(true)
        const editResults = await updateAnnotation(initialAnnotation._id!.toString(), editedVersion)
        if (editResults.message == 'Success') {
            toast.success('Annotation updated!')
        }
        setAnnotations([{
            ...annotation,
            text: editedVersion
        }])
        setEditMode(false)
        setEditSaving(false)
    }

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

    const getPostDate = (date: Date): string => {
        const now = new Date()
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
        <div className="md:mx-4 min-h-lvh mt-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-grow items-center pb-4">
                        <Link 
                            href={'/'}
                            className={buttonVariants({variant: 'ghost', size: 'icon'})}
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>
                        Annotation
                    </div>
                    {
                        author.id == currentUserId ?
                        <div className="flex flex-row">
                            <div className="flex flex-grow items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={author?.avatar} alt={author?.name} />
                                    <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{annotation.userName}</CardTitle>
                                    <CardDescription>
                                        {
                                            !annotation.unboundAnnotation ?
                                            <>on {`${toTitleCase(annotation.bookId.replaceAll('-', ' '))} ${annotation.chapterNumber}:${annotation.verseNumber}`} • </> 
                                            : null
                                        }
                                        {getPostDate(new Date(annotation.createdAt))}
                                    </CardDescription>
                                </div>
                            </div>
                            <Button 
                                className="flex-shrink-0"
                                variant={'ghost'}
                                size={'icon'}
                                onClick={() => {
                                    setEditMode(true)
                                    setEditedVersion(annotation.text)
                                }}
                            >
                                <Edit3Icon className="w-4 h-4" />
                            </Button>
                        </div>
                        :
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
                                        <>on {`${toTitleCase(annotation.bookId.replaceAll('-', ' '))} ${annotation.chapterNumber}:${annotation.verseNumber}`} • </> 
                                        : null
                                    }
                                    {getPostDate(new Date(annotation.createdAt))}
                                </CardDescription>
                            </div>
                        </div>
                    }
                </CardHeader>
                <CardContent>
                    {
                        !annotation.unboundAnnotation && (
                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                <div className="flex-1 space-y-1">
                                    <span className={cn(getBackgroundColor(), 'rounded p-1 text-sm font-medium leading-none')}>
                                        {annotation.highlightedText}
                                    </span>
                                </div>
                            </div>
                        )
                    }
                    {
                        editMode && author.id == currentUserId ?
                            <>
                                <AutoResizeTextarea
                                    value={editedVersion}
                                    onChange={(e) => setEditedVersion(e.target.value)}
                                />
                                <div className="justify-end space-x-2 mt-2">
                                    {
                                        editSaving ?
                                        <LoaderCircleIcon className="animate-spin w-4 h-4" />
                                        :
                                        <>
                                        <Button 
                                            variant={'secondary'}
                                            className="justify-self-end"
                                            onClick={() => setEditMode(false)}
                                        >Cancel</Button>
                                        <Button 
                                            className="justify-self-end"
                                            onClick={() => saveEditOfAnnotation()}
                                        >Update</Button>
                                        </>
                                    }
                                </div>
                            </>
                        :
                        <p className="text-foreground whitespace-pre-wrap">{annotation.text}</p>
                    }
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4 border-t-4 border-b">
                    {
                        addCommentOpen ?
                            <div className="flex flex-col w-full">
                                <AutoResizeTextarea 
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
                                <MessageCircleIcon className="h-4 w-4" /> { annotation.comments.length ?? null }
                            </Button>
                            <motion.div whileTap={{ scale: 0.8 }}>
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
                                    { annotation.likes.length ?? null }
                                </Button>
                            </motion.div>
                            {
                                !annotation.unboundAnnotation ?
                                <Link 
                                    className={cn(buttonVariants({variant: 'ghost', size: 'sm'}), "gap-2")}
                                    href={`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumber}`}
                                >
                                        <ExternalLinkIcon className="h-4 w-4" />
                                        <span>View in Context</span>
                                </Link>
                                :
                                null
                            }
                        </>
                    }
                </CardFooter>
            </Card>
            {
                annotation.comments.map(comment => {
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
                                            {getPostDate(new Date(comment.timeStamp))}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                            </CardContent>
                        </Card>
                    )
                })
            }
        </div>
    )
}