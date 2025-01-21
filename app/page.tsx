import { ContinueReading } from "@/components/continue-reading"
import { RecentAnnotations } from "@/components/recent-annotations"
import { fetchRecentAnnotations } from "@/lib/annotations/data"

export default async function HomePage() {
  const recentAnnotations = await fetchRecentAnnotations()
  return (
    <div className="space-y-8 pt-8 px-4">
      <ContinueReading />
      <div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Recent Annotations and Notes</h2>
          <p className="text-muted-foreground">
            See thoughts shared by the fam
          </p>
        </div>
        <div className="mt-6">
          <RecentAnnotations recentAnnotations={recentAnnotations ?? []} />
        </div>
      </div>
    </div>
  )
}

