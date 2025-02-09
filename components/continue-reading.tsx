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
import { BookmarkedSpot } from "@/lib/reading/definitions"
import { toTitleCase } from "@/lib/utils"
import { Chapter } from "@/types/scripture"


export function ContinueReading({bookmark, chapterData, progress}: {
    bookmark: BookmarkedSpot | null,
    chapterData: Chapter | null | undefined,
    progress: number
}) {
    return (
        <Card className="relative overflow-hidden w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    { bookmark ? 'Continue Reading' : 'Start Reading' }
                </CardTitle>
                <CardDescription>{ bookmark ? 'Pick up where you left off' : 'Start Fresh' }</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {
                        bookmark ?
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{toTitleCase(bookmark.bookId.replaceAll('-', ' '))} - Chapter {bookmark?.chapterNumber}</p>
                                <span className="text-sm text-muted-foreground">
                                    Verse {bookmark?.verseNumber} of {chapterData?.verses.length}
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        : null
                    }
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last read {bookmark?.lastRead.toDateString()}</span>
                        <Button asChild>
                            {
                                bookmark ?
                                <Link 
                                    href={`/book/${encodeURIComponent(bookmark.bookId)}/chapter/chapter_${bookmark.chapterNumber}/#verse-${bookmark.verseNumber}`}
                                    className="gap-2"
                                >
                                    Continue <ArrowRight className="h-4 w-4" />
                                </Link>
                                : 
                                <Link 
                                    href={'/intro/title-page'}
                                    className="gap-2"
                                >
                                    Start Reading <ArrowRight className="h-4 w-4" />
                                </Link>
                            }
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

