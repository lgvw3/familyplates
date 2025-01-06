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
    "The First Book Of Nephi": ["Chapter 1", "1 Nephi 2", "1 Nephi 3", "1 Nephi 4"],
    "Second Nephi": ["2 Nephi 1", "2 Nephi 2", "2 Nephi 3", "2 Nephi 4"],
    "Book of Jacob": ["Jacob 1", "Jacob 2", "Jacob 3", "Jacob 4"],
    "Book of Alma": ["Alma 1", "Alma 2", "Alma 3", "Alma 4"],
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
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
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

