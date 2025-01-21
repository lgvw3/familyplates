'use client'

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ExternalLinkIcon, MessageSquareIcon } from 'lucide-react'
import { Annotation } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"

const getInitials = (name?: string): string => {
    if (!name) {
        return ''
    }
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
};

function toTitleCase(str: string): string {
    return str
      .split(' ') // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word and lowercase the rest
      .join(' '); // Join the words back into a single string
}

export function RecentAnnotations({recentAnnotations}: {recentAnnotations: Annotation[]}) {
    const userMap = fetchUsersAsMap()
    const { annotations } = useWebSocket(recentAnnotations, true) 
    return (
        <div className="grid gap-6">
            {
                annotations.map((annotation) => {
                    const user = userMap.get(annotation.userId)
                    return (
                        <Card key={annotation._id?.toString()}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={user?.avatar} alt={user?.name} />
                                        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
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
                                <p className="text-muted-foreground">{annotation.text}</p>
                            </CardContent>
                            <CardFooter className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <MessageSquareIcon className="h-4 w-4" />
                                    
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2" asChild>
                                    <Link 
                                        href={`/book/${encodeURIComponent(annotation.bookId)}/chapter/chapter_${annotation.chapterNumber}/#verse-${annotation.verseNumber}`}
                                    >
                                        <ExternalLinkIcon className="h-4 w-4" />
                                        <span>View in Context</span>
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                }
            )
        }
        </div>
    )
}

