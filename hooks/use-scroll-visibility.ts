"use client"

import { useEffect, useRef, useState } from "react"

const SCROLL_THRESHOLD = 6
const TOP_REVEAL_OFFSET = 24

export function useScrollVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = Math.max(window.scrollY, 0)

    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0)
      const delta = currentScrollY - lastScrollY.current

      if (currentScrollY <= TOP_REVEAL_OFFSET) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (Math.abs(delta) < SCROLL_THRESHOLD) return

      setIsVisible(delta < 0)
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return isVisible
}
