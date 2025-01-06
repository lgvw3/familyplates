"use client"

import Link from "next/link"
import { ChevronRight, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

const books = {
    "The First Book Of Nephi": Array.from({ length: 22 }, (_, i) => `Chapter ${i + 1}`),
    "The Second Book Of Nephi": Array.from({ length: 33 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Jacob": Array.from({ length: 7 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Jarom": Array.from({ length: 1 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Omni": Array.from({ length: 1 }, (_, i) => `Chapter ${i + 1}`),
    "The Words Of Mormon": Array.from({ length: 1 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Mosiah": Array.from({ length: 29 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Alma": Array.from({ length: 63 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Helaman": Array.from({ length: 16 }, (_, i) => `Chapter ${i + 1}`),
    "Third Nephi The Book Of Nephi": Array.from({ length: 30 }, (_, i) => `Chapter ${i + 1}`),
    "Fourth Nephi The Book Of Nephi": Array.from({ length: 1 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Mormon": Array.from({ length: 9 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Ether": Array.from({ length: 15 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Moroni": Array.from({ length: 10 }, (_, i) => `Chapter ${i + 1}`),
}

export function Navigation() {
    return (
        <div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="fixed left-4 top-3 z-50 h-8 w-8">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-4">
                        <NavigationItems />
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    )
}

function NavigationItems() {
    return (
        <div className="space-y-4">
            {Object.entries(books).map(([book, chapters]) => (
                <Collapsible key={book}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex w-full items-center justify-between p-2"
                        >
                            <span className="text-sm font-medium">{book}</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                        {chapters.map((chapter) => (
                            <Link
                                key={chapter}
                                href={`/book/${encodeURIComponent(book.toLowerCase().replaceAll(" ", "-"))}/chapter/${encodeURIComponent(chapter.toLowerCase().replaceAll(" ", "_"))}`}
                                className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                {chapter}
                            </Link>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    )
}

