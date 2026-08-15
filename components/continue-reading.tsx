import Link from "next/link"
import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { BookmarkedSpot } from "@/lib/reading/definitions"
import { motion } from "framer-motion"


export function ContinueReading({bookmark}: {
    bookmark: BookmarkedSpot | null,
}) {
    const href = bookmark
        ? `/book/${encodeURIComponent(bookmark.bookId)}/chapter/chapter_${bookmark.chapterNumber}/#verse-${bookmark.verseNumber}`
        : '/intro/title-page'
    const label = bookmark ? 'Continue reading' : 'Start reading'

    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.94 }}
            variants={{
                rest: { scale: 1 },
                hover: { scale: 1.04 },
            }}
        >
            <Button asChild size="icon" className="size-14 rounded-full border shadow-lg shadow-black/25">
                <Link href={href} aria-label={label} title={label}>
                    <span className="relative flex size-6 items-center justify-center overflow-hidden">
                        <motion.span
                            variants={{
                                rest: { x: 0 },
                                hover: { x: 24 },
                            }}
                            transition={{ duration: 0.24, ease: 'easeIn' }}
                            className="absolute"
                        >
                            <BookOpen className="size-6" />
                        </motion.span>
                        <motion.span
                            variants={{
                                rest: { x: -24 },
                                hover: { x: 0 },
                            }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                            className="absolute"
                        >
                            <ArrowRight className="size-6" />
                        </motion.span>
                    </span>
                </Link>
            </Button>
        </motion.div>
    )
}
