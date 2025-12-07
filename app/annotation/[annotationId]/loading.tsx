// app/annotation/[annotationId]/loading.tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Loading() {
    return (
        <div className="md:mx-4 min-h-lvh mt-4">
            <Card className="animate-pulse">
                <CardHeader>
                    {/* Top bar with back button + title */}
                    <div className="flex items-center gap-3 pb-4">
                        <div className="h-9 w-9 rounded-md bg-muted" />
                        <div className="h-5 w-24 rounded-md bg-muted" />
                    </div>

                    {/* Author row */}
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <div className="h-10 w-10 rounded-full bg-muted" />
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded-md bg-muted" />
                            <div className="h-3 w-40 rounded-md bg-muted" />
                        </div>
                        <Button variant="ghost" size="icon" disabled>
                            <div className="h-4 w-4 rounded-md bg-muted" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Highlighted scripture box */}
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <div className="flex-1 space-y-2">
                            <span className="inline-block h-5 w-40 rounded bg-muted" />
                        </div>
                    </div>

                    {/* Annotation text lines */}
                    <div className="space-y-2">
                        <div className="h-3 w-full rounded-md bg-muted" />
                        <div className="h-3 w-11/12 rounded-md bg-muted" />
                        <div className="h-3 w-10/12 rounded-md bg-muted" />
                    </div>
                </CardContent>

                <CardFooter className="flex items-center gap-3 pt-4 border-t-4 border-b">
                    {/* Comment / like / view in context / share buttons */}
                    <div className="h-8 w-24 rounded-md bg-muted" />
                    <div className="h-8 w-20 rounded-md bg-muted" />
                    <div className="h-8 w-28 rounded-md bg-muted" />
                    <div className="h-8 w-10 rounded-md bg-muted" />
                </CardFooter>
            </Card>

            {/* A couple of comment skeletons */}
            {[0, 1].map((i) => (
                <Card key={i} className="rounded-none animate-pulse">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <div className="h-8 w-8 rounded-full bg-muted" />
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-32 rounded-md bg-muted" />
                                <div className="h-3 w-24 rounded-md bg-muted" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="h-3 w-full rounded-md bg-muted" />
                            <div className="h-3 w-5/6 rounded-md bg-muted" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}