'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { cn } from '@/lib/utils'

type FamilyProfileTab = 'annotations' | 'interactions'

const tabs: Array<{ id: FamilyProfileTab; label: string }> = [
  { id: 'annotations', label: 'Recent annotations' },
  { id: 'interactions', label: 'Recent interactions' },
]

export function FamilyProfileTabs({
  annotations,
  interactions,
  initialTab = 'annotations',
}: {
  annotations: ReactNode
  interactions: ReactNode
  initialTab?: FamilyProfileTab
}) {
  const [activeTab, setActiveTab] = useState<FamilyProfileTab>(initialTab)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const selectTab = (tab: FamilyProfileTab, focus = false) => {
    setActiveTab(tab)
    if (focus) tabRefs.current[tabs.findIndex(item => item.id === tab)]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: FamilyProfileTab) => {
    const currentIndex = tabs.findIndex(item => item.id === tab)
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === undefined) return
    event.preventDefault()
    selectTab(tabs[nextIndex].id, true)
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return
    selectTab(deltaX < 0 ? 'interactions' : 'annotations')
  }

  return (
    <div className="touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div role="tablist" aria-label="Family profile content" className="flex border-b">
        {tabs.map((tab, index) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={element => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`family-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`family-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={event => handleKeyDown(event, tab.id)}
              className={cn(
                'relative -mb-px flex-1 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                selected ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        id={`family-${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`family-${activeTab}-tab`}
        tabIndex={0}
        className="min-h-24 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {activeTab === 'annotations' ? annotations : interactions}
      </div>
    </div>
  )
}
