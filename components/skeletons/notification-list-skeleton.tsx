export function NotificationListSkeleton() {
  return (
    <div aria-label="Loading notifications" role="status">
      {[0, 1, 2, 3, 4].map(item => (
        <div key={item} className="flex animate-pulse gap-3 border-b border-border/70 px-4 py-4 md:px-8">
          <div className="size-11 shrink-0 rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </div>
      ))}
      <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))]" />
    </div>
  )
}
