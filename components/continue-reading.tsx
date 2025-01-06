import Link from "next/link"
import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LastReadProps {
    chapter: string
    verse: number
    totalVerses: number
    lastReadAt: string
}

const lastRead: LastReadProps = {
    chapter: "1 Nephi 3",
    verse: 7,
    totalVerses: 24,
    lastReadAt: "2 hours ago"
}

export function ContinueReading() {
    const progress = (lastRead.verse / lastRead.totalVerses) * 100

    return (
        <Card className="relative overflow-hidden w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Continue Reading
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{lastRead.chapter}</p>
                            <span className="text-sm text-muted-foreground">
                                Verse {lastRead.verse} of {lastRead.totalVerses}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last read {lastRead.lastReadAt}</span>
                        <Button asChild>
                            <Link 
                                href={`/scriptures/${lastRead.chapter.toLowerCase().replace(" ", "-")}?verse=${lastRead.verse}`}
                                className="gap-2"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

