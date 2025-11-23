import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpenIcon } from "lucide-react"

export function ContinueReadingSkeleton() {
    return (
        <Card className="relative overflow-hidden w-full animate-pulse">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="h-5 w-32 rounded-md bg-muted" />
                </CardTitle>
                <CardDescription>
                    <span className="h-4 w-40 rounded-md bg-muted inline-block" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                            <span className="h-4 w-48 rounded-md bg-muted" />
                            <span className="h-3 w-32 rounded-md bg-muted" />
                        </div>
                        <div className="h-2 w-full rounded-md bg-muted" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="h-3 w-32 rounded-md bg-muted" />
                        <span className="h-9 w-28 rounded-md bg-muted" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}