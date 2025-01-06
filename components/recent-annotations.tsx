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
import { ExternalLink, MessageSquare } from 'lucide-react'

const recentAnnotations = [
    {
        id: 1,
        user: {
        name: "Ashley",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AM",
        },
        scripture: "1 Nephi 3:7",
        content:
        "This verse demonstrates the principle of obedience and faith. Nephi's response shows his unwavering trust in the Lord's commandments...",
        timestamp: "2 hours ago",
        comments: 3,
    },
    {
        id: 2,
        user: {
        name: "Kayla",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "KVW",
        },
        scripture: "Alma 32:21",
        content:
        "A powerful definition of faith is presented here. The comparison to a seed helps us understand how faith grows and develops...",
        timestamp: "5 hours ago",
        comments: 7,
    },
    {
        id: 3,
        user: {
        name: "Gerret",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "GVW",
        },
        scripture: "2 Nephi 2:25",
        content:
        "This verse succinctly explains the purpose of our existence. The relationship between joy and existence is profound...",
        timestamp: "1 day ago",
        comments: 5,
    },
]

export function RecentAnnotations() {
    return (
        <div className="grid gap-6">
            {recentAnnotations.map((annotation) => (
                <Card key={annotation.id}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={annotation.user.avatar} alt={annotation.user.name} />
                                <AvatarFallback>{annotation.user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base">{annotation.user.name}</CardTitle>
                                <CardDescription>
                                    on {annotation.scripture} • {annotation.timestamp}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{annotation.content}</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{annotation.comments}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                            <Link href={`/scriptures/${annotation.scripture.toLowerCase().replace(" ", "-")}`}>
                                <ExternalLink className="h-4 w-4" />
                                <span>View in Context</span>
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

