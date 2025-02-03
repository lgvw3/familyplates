import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    // Skip middleware for the /api/auth route
    if (pathname.startsWith('/api/auth')) {
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
    else {
        // Re-set the cookie with SameSite=None and Secure
        response.cookies.set({
            name: 'familyPlatesAuthToken',
            value: authToken,
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure only in production
            path: '/',
            sameSite: 'none'
        });
    }

    // Continue to the requested page
    return NextResponse.next();
}

// Protect the homepage and other routes
export const config = {
    matcher: ['/'],
};
