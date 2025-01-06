import Link from "next/link"
import { BookMarked } from 'lucide-react'
import { ThemeToggle } from "./theme-toogle"
import { CommandMenu } from "./command-menu"

export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
            <div className="container flex h-14 items-center justify-between">
                <div></div>
                <Link href="/" className="flex items-center gap-2 font-bold">
                    <BookMarked className="h-5 w-5" />
                    <span>Family Plates</span>
                </Link>
                <div >
                    <ThemeToggle />
                    <CommandMenu />
                </div>
            </div>
        </header>
    )
  }

