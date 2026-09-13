import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/providers"

import "@/app/globals.css"
import { Metadata, Viewport } from 'next';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Navigation } from '@/components/navigation';
import { Toaster } from '@/components/ui/sonner';
import { HeaderProvider } from '@/components/header-context';
import { ThemeChrome } from '@/components/theme-chrome';

const inter = Inter({ subsets: ["latin"] })
export const metadata: Metadata = {
  title: "Family Plates",
  description: "Our own, Van Wagoner, small plates",
  appleWebApp: {
    capable: true,
    title: 'Family Plates',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

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
          <ThemeChrome />
          <HeaderProvider>
            <Header />
            <Navigation />
            <main>
              {children}
            </main>
            <Toaster richColors />
            <Footer />
          </HeaderProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

