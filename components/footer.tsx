import Link from "next/link"
import { BookMarked } from 'lucide-react'

export function Footer() {
    return (
        <footer className="w-full border-b flex items-center justify-evenly pt-8">
            <div className="container flex items-center justify-evenly">
                <Link href="/" className="flex items-center gap-2 font-light">
                    <BookMarked className="h-3 w-3" />
                    <span>Van Wagoner Family Plates</span>
                </Link>
            </div>
        </footer>
    )
  }

