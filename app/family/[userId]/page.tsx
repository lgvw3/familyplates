import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FamilyProfileTabs } from '@/components/family/profile-tabs'
import { ProfileAvatarEditor } from '@/components/family/profile-avatar-editor'
import { ProfileInteractions } from '@/components/family/profile-interactions'
import { ProfileAnnotations } from '@/components/scripture-people/profile-annotations'
import { fetchAnnotationsByUser } from '@/lib/annotations/data'
import { accounts } from '@/lib/auth/accounts'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchFamilyAccount, fetchFamilyAccounts, fetchFamilyInteractions } from '@/lib/auth/profiles'

export const instant = false

type FamilyProfilePageProps = { params: Promise<{ userId: string }> }

function parseUserId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : null
}

export async function generateMetadata({ params }: FamilyProfilePageProps): Promise<Metadata> {
  const userId = parseUserId(decodeURIComponent((await params).userId))
  const account = userId === null ? undefined : accounts.find(candidate => candidate.id === userId)
  if (!account) return { title: 'Family profile not found' }
  return { title: `${account.name} | Family Plates` }
}

export default async function FamilyProfilePage({ params }: FamilyProfilePageProps) {
  const userId = parseUserId(decodeURIComponent((await params).userId))
  if (userId === null || !accounts.some(account => account.id === userId)) notFound()
  const currentUserId = await fetchCurrentUserId()
  if (!currentUserId) redirect('/sign-in')

  const [profile, users, annotations, interactions] = await Promise.all([
    fetchFamilyAccount(userId),
    fetchFamilyAccounts(),
    fetchAnnotationsByUser(userId, false, 25),
    fetchFamilyInteractions(userId, 25),
  ])
  if (!profile) notFound()

  const recentAnnotations = annotations ?? []
  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link href="/family" className="inline-flex text-sm text-primary underline-offset-4 hover:underline">
        ← Back to family
      </Link>
      <article className="text-card-foreground">
        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <ProfileAvatarEditor
            name={profile.name}
            avatar={profile.avatar}
            editable={profile.id === currentUserId}
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
          </div>
        </header>
        <section className="mt-8 border-t pt-5" aria-label="Family profile activity">
          <FamilyProfileTabs
            initialTab={recentAnnotations.length || !interactions.length ? 'annotations' : 'interactions'}
            annotations={recentAnnotations.length ? (
              <ProfileAnnotations annotations={recentAnnotations} users={users} currentUserId={currentUserId} />
            ) : (
              <p className="px-3 py-4 text-sm text-muted-foreground">No annotations shared yet.</p>
            )}
            interactions={interactions.length ? (
              <ProfileInteractions interactions={interactions} />
            ) : (
              <p className="px-3 py-4 text-sm text-muted-foreground">No likes or comments yet.</p>
            )}
          />
        </section>
      </article>
    </main>
  )
}
