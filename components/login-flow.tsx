'use client'

import { useState } from 'react'
import { Loader2Icon, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.55l3.34-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.95 5.45l3.34 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  )
}

export default function LoginFlow({
  googleConfigured,
  error,
}: {
  googleConfigured: boolean
  error?: string
}) {
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
        errorCallbackURL: '/sign-in',
      })
      if (!result.error) return
      toast.error(result.error.message ?? 'Google sign-in could not be started.')
    } catch (error) {
      console.error('Google sign-in failed:', error)
      toast.error('Google sign-in could not be started.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const message = error
    ? error === 'family_email_not_allowed'
      ? 'That Google account is not yet on the Family Plates member list.'
      : 'Sign-in did not complete. Please try again.'
    : null

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-green-950 dark:to-blue-950">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 pt-7">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome to Family Plates</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with the Google account your family has on file.
              </p>
            </div>
          </div>

          {message && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </div>
          )}

          <Button
            variant="outline"
            className="h-11 w-full gap-3"
            onClick={handleGoogleSignIn}
            disabled={!googleConfigured || isSigningIn}
          >
            {isSigningIn ? <Loader2Icon className="size-5 animate-spin" /> : <GoogleIcon />}
            {isSigningIn ? 'Opening Google…' : 'Continue with Google'}
          </Button>

          {!googleConfigured && (
            <p className="text-center text-xs text-muted-foreground">
              Google sign-in is waiting for the site administrator to add OAuth credentials.
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Access is limited to invited family email addresses.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
