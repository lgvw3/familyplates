import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public access to these routes:
    if (
        pathname.startsWith('/api/og') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') || // Next.js assets
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/annotation') // <-- Make annotation pages public for OG previews!
    ) {
        return NextResponse.next();
    }

    const authToken = request.cookies.get('familyPlatesAuthToken')?.value;

    if (process.env.NODE_ENV != "production") {
        console.log('Auth Token from middleware:', authToken) // Debugging log
    }
    if (!authToken) {
        // Redirect to the sign-in page if no token is found
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Continue to the requested page
    return NextResponse.next();
}

// Protect the homepage and other routes
export const config = {
    matcher: ['/'],
};
