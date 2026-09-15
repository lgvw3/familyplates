"use client"

import Link from "next/link"
import { Bell, Home, MessageCircle, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CommandMenu } from '@/components/command-menu'
import { useScrollVisibility } from '@/hooks/use-scroll-visibility'
import { fetchUnreadNotificationCount } from '@/lib/notifications/data'
import { formatNotificationBadge, notificationCountKey } from '@/lib/notifications/query'

export function Footer() {
    const isVisible = useScrollVisibility()
    const pathname = usePathname()
    const unread = useQuery({ queryKey: notificationCountKey, queryFn: fetchUnreadNotificationCount })
    const badge = formatNotificationBadge(unread.data ?? 0)

    const itemClass = "flex min-w-20 flex-1 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

    return (
        <motion.footer
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80"
            style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
        >
            <nav aria-label="Feed navigation" className="mx-auto flex h-14 w-full max-w-md items-stretch justify-around px-4">
                <Link href="/" aria-label="Home" title="Home" aria-current={pathname === '/' ? 'page' : undefined} className={`${itemClass} ${pathname === '/' ? 'text-primary' : ''}`}>
                    <Home className="size-6" />
                </Link>
                <CommandMenu
                    renderTrigger={(openMenu) => (
                        <button type="button" aria-label="Search scriptures" title="Search" className={itemClass} onClick={openMenu}>
                            <Search className="size-6" />
                        </button>
                    )}
                />
                <Link href="/chat" aria-label="Family chat" title="Family chat" aria-current={pathname === '/chat' ? 'page' : undefined} className={`${itemClass} ${pathname === '/chat' ? 'text-primary' : ''}`}>
                    <MessageCircle className="size-6" />
                </Link>
                <Link
                    href="/notifications"
                    aria-label={badge ? `Notifications, ${badge === '10+' ? '10 or more' : badge} unread` : 'Notifications'}
                    title="Notifications"
                    aria-current={pathname === '/notifications' ? 'page' : undefined}
                    className={`${itemClass} relative ${pathname === '/notifications' ? 'text-primary' : ''}`}
                >
                    <Bell className="size-6" />
                    {badge && (
                        <span className="absolute left-1/2 top-1.5 ml-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-destructive-foreground">
                            {badge}
                        </span>
                    )}
                </Link>
            </nav>
        </motion.footer>
    )
  }
