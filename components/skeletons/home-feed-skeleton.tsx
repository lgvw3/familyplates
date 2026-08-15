import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Avatar } from "../ui/avatar"

export function HomeFeedSkeleton() {
    return (
        <div>
            <div className="space-y-0 md:px-8">
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

            {/* Floating actions remain visible while the feed is loading. */}
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
                <div className="size-14 animate-pulse rounded-full bg-secondary" />
                <div className="size-14 animate-pulse rounded-full bg-primary" />
            </div>
        </div>
    )
}
