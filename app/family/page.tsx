import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { getInitials } from '@/lib/utils'

export const instant = false

export default async function FamilyPage() {
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) redirect('/sign-in')
  const family = await fetchFamilyAccounts()

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link href="/" className="inline-flex text-sm text-primary underline-offset-4 hover:underline">
        ← Back to annotations
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family</h1>
        <p className="mt-2 text-muted-foreground">See what everyone has been sharing and enjoying.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {family.map(member => (
          <li key={member.id}>
            <Link
              href={`/family/${member.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-12">
                <AvatarImage src={member.avatar} alt={`${member.name}'s profile photo`} className="object-cover" />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name}</span>
              {member.id === currentUserId && <span className="ml-auto text-xs text-muted-foreground">You</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
