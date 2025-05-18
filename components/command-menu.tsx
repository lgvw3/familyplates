"use client"

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
import Fuse, { FuseResult } from "fuse.js";
import { useEffect, useState } from "react"
import { ScriptureItem, SearchResult } from "@/types/scripture"
import { Badge } from "./ui/badge"

const books = {
    "The First Book Of Nephi": Array.from({ length: 22 }, (_, i) => `Chapter ${i + 1}`),
    "The Second Book Of Nephi": Array.from({ length: 33 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Jacob": Array.from({ length: 7 }, (_, i) => `Chapter ${i + 1}`),
    "The Book Of Enos": Array.from({ length: 1 }, (_, i) => `Chapter ${i + 1}`),
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



function searchScriptures(query: string, fuse: Fuse<ScriptureItem> | null): SearchResult[] {
    if (fuse && query.trim()) {
        const searchResults: SearchResult[] = fuse.search(query).map((result: FuseResult<ScriptureItem>) => ({
            ...result.item,
            matches: Array.from(result.matches || [])
        }));
        return searchResults
    }
    return []
}

// Fuse.js options with types
const fuseOptions = {
    keys: ["text", "summary", "content"], // Specify searchable fields
    threshold: 0.4, // Adjust sensitivity for fuzzy matching
    includeMatches: true, // Include match metadata in results
};

export function CommandMenu() {
    const [open, setOpen] = useState(false)
    const [results, setResults] = useState<SearchResult[] | null>(null)
    const [query, setQuery] = useState<string | null>(null)
    const [fuse, setFuse] = useState<Fuse<ScriptureItem> | null>(null);
    useEffect(() => {
        fetch("/preprocessed_scripture_data.json")
            .then(res => res.json())
            .then(incomingData => {
                //setData(incomingData)
                setFuse(new Fuse<ScriptureItem>(incomingData, fuseOptions))
            })
            .catch(err => console.error("Failed to load scripture data:", err));
    }, []);


    useEffect(() => {
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

        <CommandDialog 
            open={open} 
            onOpenChange={(b) => {
                if (!b) {
                    setQuery(null)
                    setResults(null)
                }
                setOpen(b)
            }}
            shouldFilter={false}
        >
            <CommandInput 
                placeholder="Search scriptures..."
                onChangeCapture={(e) => {
                    setQuery(e.currentTarget.value)
                    setResults(searchScriptures(e.currentTarget.value, fuse))
                }}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {
                    results && results.length && query?.trim().length ?
                        <CommandGroup heading={"Results"} key={results[0].id}>
                            {results.slice(0, 15).map((result) => (
                                result.type == 'book' ?
                                    <Link
                                        key={result.id}
                                        href={`/book/${encodeURIComponent(result.id)}/chapter/chapter_1`}
                                        className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <CommandItem
                                            onSelect={() => {
                                                setOpen(false)
                                            }}
                                        >
                                            {result.text} <Badge variant={'book'}>Book</Badge>
                                        </CommandItem>
                                    </Link>
                                : result.type == 'chapter' ?
                                    <Link
                                        key={result.id}
                                        href={`/book/${encodeURIComponent(result.book_id)}/chapter/${result.chapter_id.toLowerCase().replace(' ', '_')}`}
                                        className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <CommandItem
                                            onSelect={() => {
                                                setOpen(false)
                                            }}
                                        >
                                            {result.summary} <Badge variant={'chapter'}>Chapter</Badge>
                                        </CommandItem>
                                    </Link>
                                : result.type == 'verse' ?
                                <Link
                                    key={result.id}
                                    href={`/book/${encodeURIComponent(result.book_id)}/chapter/${result.chapter_id.toLowerCase().replace(' ', '_')}/#verse-${result.verse_number}`}
                                    className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false)
                                        }}
                                    >
                                        {result.text} <Badge>Verse</Badge>
                                    </CommandItem>
                                </Link>
                                : result.type == 'intro' && result.title ?
                                <Link
                                    key={result.id}
                                    href={`/intro/${encodeURIComponent(result.title?.toLowerCase().replaceAll(' ', '-'))}/#index-${result.index}`}
                                    className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false)
                                        }}
                                    >
                                        {result.text} <Badge variant={'book'}>Intro</Badge>
                                    </CommandItem>
                                </Link>
                                : null
                            ))}
                        </CommandGroup>
                    :
                    Object.entries(books).map(([book, chapters]) => (
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
                    ))
                }
            </CommandList>
        </CommandDialog>
        </>
    )
}

