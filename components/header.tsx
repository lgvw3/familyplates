'use client'
import { BookMarked } from 'lucide-react'
import { useHeader } from './header-context'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from './navigation'
import { useScrollVisibility } from '@/hooks/use-scroll-visibility'

export function Header() {
    const { title, subtitle } = useHeader();
    const isVisible = useScrollVisibility()

    return (
        <motion.header
            animate={{ y: isVisible ? 0 : '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="sticky top-0 z-40 flex w-full items-center justify-center border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div className="container grid h-14 grid-cols-[3rem_1fr_3rem] px-2 sm:px-4">
                <Navigation />
                <div className="relative flex h-14 items-center justify-center gap-2 font-bold">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={title ? "dynamic-title" : "default-title"}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="flex-shrink-0 text-center"
                        >
                            {!title && (
                                <div className="flex items-center justify-center gap-2">
                                    <BookMarked className="h-5 w-5" /> Family Plates
                                </div>
                            )}
                            {title}
                            {subtitle && (
                                <>
                                    <br/>
                                    <span className="text-sm font-normal">{subtitle}</span>
                                </>
                            )}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div aria-hidden="true" />
            </div>
        </motion.header>
    )
  }
