import { Inter } from 'next/font/google'
import { DataProvider, ThemeProvider } from "@/components/providers"

import "@/app/globals.css"
import { Metadata, Viewport } from 'next';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
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
          storageKey="family-plates-system-theme"
          disableTransitionOnChange
        >
          <DataProvider>
            <ThemeChrome />
            <HeaderProvider>
              <Header />
              <main>
                {children}
              </main>
              <Toaster richColors />
            </HeaderProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
