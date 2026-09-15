import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies'

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public access to these routes:
    if (
        pathname.startsWith('/api/og') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') || // Next.js assets
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/annotation') || // Annotation pages stay public for link previews.
        pathname === '/sign-in' ||
        /\.[^/]+$/.test(pathname)
    ) {
        return NextResponse.next();
    }

    if (!getSessionCookie(request)) {
        // Redirect to the sign-in page if no token is found
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Continue to the requested page
    return NextResponse.next();
}

// Protect the homepage and other routes
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
