'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const themeColors = {
  light: '#ffffff',
  dark: '#000000',
} as const

/** Keep browser and installed-PWA chrome in sync with the app theme. */
export function ThemeChrome() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return

    const color = themeColors[resolvedTheme]
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    themeColor?.setAttribute('content', color)

    const statusBarStyle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    )
    statusBarStyle?.setAttribute('content', resolvedTheme === 'dark' ? 'black-translucent' : 'default')

    // iOS uses the document canvas behind the safe-area/status-bar region.
    document.documentElement.style.backgroundColor = color
    document.body.style.backgroundColor = color
  }, [resolvedTheme])

  return null
}
