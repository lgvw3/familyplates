'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { cn } from '@/lib/utils'

type ProfileTab = 'annotations' | 'passages'

type ProfileContentTabsProps = {
  annotations: ReactNode
  passages: ReactNode
  initialTab?: ProfileTab
}

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: 'annotations', label: 'Recent annotations' },
  { id: 'passages', label: 'Associated passages' },
]

export function ProfileContentTabs({
  annotations,
  passages,
  initialTab = 'annotations',
}: ProfileContentTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const selectTab = (tab: ProfileTab, focus = false) => {
    setActiveTab(tab)
    if (focus) {
      const tabIndex = tabs.findIndex((item) => item.id === tab)
      tabRefs.current[tabIndex]?.focus()
    }
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: ProfileTab) => {
    const currentIndex = tabs.findIndex((item) => item.id === tab)
    let nextIndex: number | undefined

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex !== undefined) {
      event.preventDefault()
      selectTab(tabs[nextIndex].id, true)
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return

    const currentIndex = tabs.findIndex((item) => item.id === activeTab)
    const nextIndex = deltaX < 0
      ? Math.min(currentIndex + 1, tabs.length - 1)
      : Math.max(currentIndex - 1, 0)

    if (nextIndex !== currentIndex) selectTab(tabs[nextIndex].id)
  }

  const panel = activeTab === 'annotations' ? annotations : passages

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="touch-pan-y"
    >
      <div role="tablist" aria-label="Scripture profile content" className="flex border-b">
        {tabs.map((tab, index) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              className={cn(
                'relative -mb-px flex-1 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                selected
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        tabIndex={0}
        className="min-h-24 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {panel}
      </div>
    </div>
  )
}
