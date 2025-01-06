import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/providers"

import "@/app/globals.css"
import { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Navigation } from '@/components/navigation';

const inter = Inter({ subsets: ["latin"] })
export const metadata: Metadata = {
  title: "Family Plates",
  description: "Our own, Van Wagoner, small plates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background w-full')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <Navigation />
          <main>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}


