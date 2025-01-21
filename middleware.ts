import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for the /api/auth route
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    const authToken = request.cookies.get('familyPlatesAuthToken')?.value;

    console.log('Auth Token from middleware:', authToken); // Debugging log
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
