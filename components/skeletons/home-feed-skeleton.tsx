// components/skeletons/home-feed-skeleton.tsx
import { ContinueReadingSkeleton } from "./continue-reading"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Avatar } from "../ui/avatar"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

export function HomeFeedSkeleton() {
    return (
        <div>
            {/* Continue Reading skeleton */}
            <div className="py-4 px-4 md:px-8">
                <ContinueReadingSkeleton />
            </div>

            {/* "Recent Annotations & Notes" header */}
            <div className="flex flex-col gap-2 pt-4 px-4 md:px-8">
                <h2 className="text-2xl font-bold tracking-tight">Recent Annotations & Notes</h2>
                <p className="text-muted-foreground">See thoughts shared by the fam</p>
            </div>

            {/* Annotation creation skeleton */}
            <div className="pt-4 px-4 md:px-8">
                <Card className="overflow-auto rounded-b-none animate-pulse">
                    <CardContent className="flex items-start p-3 gap-4">
                        <Avatar className="ml-3 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                        </Avatar>
                        <div className="w-full animate-pulse">
                            <Textarea disabled />
                        </div>
                        <div className="space-y-3">
                            <div className="h-16 w-full rounded-md bg-muted" />
                            <Button disabled>
                                <span className="h-4 w-12 rounded-md bg-muted" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* A couple of annotation card skeletons */}
            <div className="mt-0 space-y-0 px-4 md:px-8">
                {[0, 1].map((i) => (
                    <Card
                        key={i}
                        className={`animate-pulse ${i === 0 ? "rounded-b-none" : "rounded-none"}`}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 rounded-md bg-muted" />
                                    <div className="h-3 w-40 rounded-md bg-muted" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-4 rounded-md border p-3">
                                <div className="flex-1">
                                    <div className="h-6 w-40 rounded-md bg-muted" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded-md bg-muted" />
                                <div className="h-3 w-5/6 rounded-md bg-muted" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center gap-4">
                            <div className="h-8 w-16 rounded-md bg-muted" />
                            <div className="h-8 w-16 rounded-md bg-muted" />
                            <div className="h-8 w-24 rounded-md bg-muted" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}