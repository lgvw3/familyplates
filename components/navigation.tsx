"use client"

import Link from "next/link"
import { ChevronRight, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserAccount } from "@/lib/auth/definitions"
import { fetchCurrentFamilyAccount } from "@/lib/auth/profile-actions"
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
import { AccountControls } from '@/components/account-controls'

export const introMaterialOrder = [
    "Title Page",
    "Title Page of the Book of Mormon",
    "Introduction",
    "Testimony of Three Witnesses",
    "Testimony of Eight Witnesses",
    "Testimony of the Prophet Joseph Smith",
    "Brief Explanation about the Book of Mormon"
]

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

export function Navigation() {
    const [user, setUser] = useState<UserAccount | null>(null)
    const [isUserLoading, setIsUserLoading] = useState(true)

    useEffect(() => {
        let isActive = true

        void fetchCurrentFamilyAccount()
            .then((account) => {
                if (isActive) setUser(account)
            })
            .catch((error) => {
                console.error('Failed to load the current family account:', error)
            })
            .finally(() => {
                if (isActive) setIsUserLoading(false)
            })

        return () => {
            isActive = false
        }
    }, [])

    const initials = user?.name
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <div className="flex items-center justify-start">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-full p-0"
                        title={user ? `Open ${user.name}'s menu` : 'Open navigation menu'}
                    >
                        <Avatar className="size-8 border bg-background shadow-sm">
                            {isUserLoading ? (
                                <span className="size-full animate-pulse rounded-full bg-muted" aria-hidden="true" />
                            ) : (
                                <>
                                    <AvatarImage src={user?.avatar} alt={user ? `${user.name}'s profile photo` : 'Profile'} className="object-cover" />
                                    <AvatarFallback className="text-xs font-semibold">
                                        {initials || <UserRound className="size-4" aria-hidden="true" />}
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>
                    <Link
                        href="/family"
                        className="mt-5 flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                        <Users className="size-4" />
                        Family profiles
                    </Link>
                    Intro
                    <nav className="mt-4 mb-4">
                        <IntroItems />
                    </nav>
                    Books
                    <nav className="mt-4">
                        <NavigationItems />
                    </nav>
                    <AccountControls />
                </SheetContent>
            </Sheet>
        </div>
    )
}

function IntroItems() {
    return (
        <div className="space-y-4">
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex w-full items-center justify-between p-2"
                    >
                        <span className="text-sm font-medium">Introductory Material</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </CollapsibleTrigger>
                {introMaterialOrder.map((title) => (
                    <CollapsibleContent key={title} className="space-y-1">
                        <Link
                            href={`/intro/${encodeURIComponent(title.toLowerCase().replaceAll(" ", "-"))}`}
                            className="block rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            {title}
                        </Link>
                    </CollapsibleContent>
                ))}
            </Collapsible>
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
