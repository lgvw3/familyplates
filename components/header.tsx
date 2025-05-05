'use client'
import Link from "next/link"
import { BookMarked, MessageCircle } from 'lucide-react'
import { ThemeToggle } from "./theme-toogle"
import { CommandMenu } from "./command-menu"
import { useHeader } from './header-context'
import { motion, AnimatePresence } from 'framer-motion'

export function Header() {
    const { title, subtitle } = useHeader();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
            <div className="container grid grid-cols-3 h-14 relative">
                <div></div>
                <Link href="/" className="flex items-center justify-center gap-2 font-bold relative h-14">
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
                </Link>
                <div className="flex items-center justify-end mr-2 gap-2">
                    <Link href="/chat" title="Family Chat" className="hover:text-primary transition-colors">
                        <MessageCircle className="h-5 w-5" />
                    </Link>
                    <ThemeToggle />
                    <CommandMenu />
                </div>
            </div>
        </header>
    )
  }

