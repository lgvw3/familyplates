// /api/auth.ts
import crypto from 'crypto';
import { accounts } from '@/lib/auth/accounts';
import { NextRequest, NextResponse } from 'next/server';

const globalPassword: string = process.env.GLOBAL_PASSWORD || '';

function generateToken(userId: number): string {
    const secret: string = process.env.SECRET_KEY || 'super-secret-key';
    return `${userId}:${crypto.createHmac('sha256', secret).update(userId.toString()).digest('hex')}`;
}

export async function POST(request: NextRequest) {
    const { password, userAccount } = await request.json()

    if (password === globalPassword) {
        const account = accounts.find(account => account.id === userAccount.id);
    
        if (account) {
            const token = generateToken(userAccount.id);
            const maxAge = 60 * 60 * 24 * 365; // 1 year in seconds
    
            const response = NextResponse.redirect(new URL('/', request.url))
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            response.cookies.set({
                name: 'familyPlatesAuthToken',
                value: token,
                maxAge,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Secure only in production
                path: '/',
            });
            return response;
        }
        return NextResponse.json({ error: 'Invalid user account' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
