"use client"

import Link from "next/link"
import { Home, MessageCircle, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { CommandMenu } from '@/components/command-menu'
import { useScrollVisibility } from '@/hooks/use-scroll-visibility'

export function Footer() {
    const isVisible = useScrollVisibility()

    const itemClass = "flex min-w-20 flex-1 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

    return (
        <motion.footer
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
            style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
        >
            <nav aria-label="Feed navigation" className="mx-auto flex h-16 w-full max-w-md items-stretch justify-around px-4">
                <Link href="/" aria-label="Home" title="Home" aria-current="page" className={`${itemClass} text-primary`}>
                    <Home className="size-6" />
                </Link>
                <CommandMenu
                    renderTrigger={(openMenu) => (
                        <button type="button" aria-label="Search scriptures" title="Search" className={itemClass} onClick={openMenu}>
                            <Search className="size-6" />
                        </button>
                    )}
                />
                <Link href="/chat" aria-label="Family chat" title="Family chat" className={itemClass}>
                    <MessageCircle className="size-6" />
                </Link>
            </nav>
        </motion.footer>
    )
  }
