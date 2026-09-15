'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'

export function AccountControls() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  if (isPending || !session) return null

  return (
    <div className="mt-6 border-t pt-4">
      <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{session.user.email}</p>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/sign-in')
              router.refresh()
            },
          },
        })}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  )
}
