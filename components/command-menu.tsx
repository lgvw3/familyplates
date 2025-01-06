"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Search } from 'lucide-react'
import Link from "next/link"

const books = {
    "The First Book Of Nephi": ["Chapter 1", "1 Nephi 2", "1 Nephi 3", "1 Nephi 4"],
    "The Second Book Of Nephi": ["2 Nephi 1", "2 Nephi 2", "2 Nephi 3", "2 Nephi 4"],
    "The Book Of Jacob": ["Jacob 1", "Jacob 2", "Jacob 3", "Jacob 4"],
    "The Book Of Jarom": [],
    "The Book Of Omni": [],
    "The Words Of Mormon": [],
    "The Book Of Mosiah": [],
    "The Book Of Alma": ["Alma 1", "Alma 2", "Alma 3", "Alma 4"],
    "The Book Of Helamen": [],
    "Third Nephi The Book Of Nephi": [],
    "Fourth Nephi The Book Of Nephi": [],
    "The Book Of Mormon": [],
    "The Book Of Ether": [],
    "The Book Of Moroni": []
}

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            setOpen((open) => !open)
        }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
        <Button
            variant="outline"
            className="right-4 top-4 h-8 w-8 rounded-full p-0 sm:right-6 sm:top-6"
            onClick={() => setOpen(true)}
        >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search scriptures</span>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search scriptures..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(books).map(([book, chapters]) => (
                    <CommandGroup key={book} heading={book}>
                    {chapters.map((chapter) => (
                        <Link
                            key={chapter}
                            href={`/book/${encodeURIComponent(book.toLowerCase().replaceAll(" ", "-"))}/chapter/${encodeURIComponent(chapter.toLowerCase().replaceAll(" ", "_"))}`}
                            className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false)
                                }}
                            >
                                {chapter}
                            </CommandItem>
                        </Link>
                    ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
        </>
    )
}

