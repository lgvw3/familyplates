import { ContinueReading } from "@/components/continue-reading"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { RecentAnnotations } from "@/components/recent-annotations"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background w-full">
      <Header />
      <Navigation />
      <main className="space-y-8 pt-8 px-4">
        <ContinueReading />
        <div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Recent Annotations</h2>
            <p className="text-muted-foreground">
              Explore the latest insights and thoughts shared by the community.
            </p>
          </div>
          <div className="mt-6">
            <RecentAnnotations />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

