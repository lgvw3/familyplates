import Link from "next/link"
import { BookMarked } from 'lucide-react'
import { ThemeToggle } from "./theme-toogle"
import { CommandMenu } from "./command-menu"

export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
            <div className="container grid grid-cols-3 h-14">
                <div></div>
                <Link href="/" className="flex items-center justify-center gap-2 font-bold">
                    <BookMarked className="h-5 w-5" />
                    <span>Family Plates</span>
                </Link>
                <div className="flex items-center justify-end mr-2 gap-2">
                    <ThemeToggle />
                    <CommandMenu />
                </div>
            </div>
        </header>
    )
  }

