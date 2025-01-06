"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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

const books = {
    "First Nephi": ["1 Nephi 1", "1 Nephi 2", "1 Nephi 3", "1 Nephi 4"],
    "Second Nephi": ["2 Nephi 1", "2 Nephi 2", "2 Nephi 3", "2 Nephi 4"],
    "Book of Jacob": ["Jacob 1", "Jacob 2", "Jacob 3", "Jacob 4"],
    "Book of Alma": ["Alma 1", "Alma 2", "Alma 3", "Alma 4"],
}

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

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
                        <CommandItem
                        key={chapter}
                        onSelect={() => {
                            router.push(`/scriptures/${chapter.toLowerCase().replace(" ", "-")}`)
                            setOpen(false)
                        }}
                        >
                        {chapter}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
        </>
    )
}

