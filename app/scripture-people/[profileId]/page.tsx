import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getScripturePersonProfile,
} from '@/lib/scripture-attribution/catalog'
import { getAssociatedPassagesForProfile, type ScripturePersonAssociatedPassage } from '@/lib/scripture-attribution/rules'
import { fetchAnnotationsByScripturePerson } from '@/lib/annotations/data'
import { toTitleCase } from '@/lib/utils'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchUsersAsMap } from '@/lib/auth/accounts'
import { ProfilePortraitTooltip } from '@/components/scripture-people/profile-portrait-tooltip'
import { ProfileContentTabs } from '@/components/scripture-people/profile-content-tabs'
import { ProfileAnnotations } from '@/components/scripture-people/profile-annotations'

// This authenticated page reads a live profile timeline from MongoDB.
// Cache Components needs it to block at request time instead of prerendering.
export const instant = false

type ScripturePersonProfilePageProps = {
  params: Promise<{ profileId: string }>
}

function associatedPassageHref(passage: ScripturePersonAssociatedPassage) {
  if (passage.target.kind === 'intro') {
    return `/intro/${encodeURIComponent(passage.target.introId ?? '')}`
  }
  return `/book/${encodeURIComponent(passage.target.bookId ?? '')}/chapter/chapter_${passage.target.chapterNumber ?? 1}`
}

function associatedPassageTitle(passage: ScripturePersonAssociatedPassage) {
  if (passage.target.kind === 'intro') return toTitleCase((passage.target.introId ?? passage.ruleId).replaceAll('-', ' '))

  const bookTitle = toTitleCase((passage.target.bookId ?? '').replaceAll('-', ' '))
  if (!passage.target.chapterNumber) return bookTitle

  const start = passage.target.start.unit
  const end = passage.target.end.unit === Number.MAX_SAFE_INTEGER ? 'end' : passage.target.end.unit
  const verses = start === end ? `${start}` : `${start}–${end}`
  return `${bookTitle} ${passage.target.chapterNumber}:${verses}`
}

export async function generateMetadata({ params }: ScripturePersonProfilePageProps): Promise<Metadata> {
  const { profileId } = await params
  const profile = getScripturePersonProfile(decodeURIComponent(profileId))

  if (!profile) return { title: 'Scripture profile not found' }

  return {
    title: `${profile.name} | Scripture People`,
    description: profile.biography,
  }
}

export default async function ScripturePersonProfilePage({ params }: ScripturePersonProfilePageProps) {
  const { profileId } = await params
  const profile = getScripturePersonProfile(decodeURIComponent(profileId))
  if (!profile) notFound()

  const portraitObjectPosition = (profile as typeof profile & {
    portraitObjectPosition?: string
    objectPosition?: string
  }).portraitObjectPosition ?? (profile as typeof profile & { objectPosition?: string }).objectPosition

  const members = (profile.memberIds ?? []).flatMap((memberId) => {
    const member = getScripturePersonProfile(memberId)
    return member ? [member] : []
  })
  const associatedPassages = getAssociatedPassagesForProfile(profile.id)
  const recentAnnotations = await fetchAnnotationsByScripturePerson(profile.id, 25)
  const currentUserId = await fetchCurrentUserId()
  if (currentUserId == null) redirect('/sign-in')
  const users = Array.from(fetchUsersAsMap().values())
  const provenanceLabel = profile.portraitProvenance.kind === 'generated'
    ? 'AI-generated artistic depiction'
    : profile.portraitProvenance.kind === 'official'
      ? 'Official artwork'
      : 'Editorial depiction'
  const provenanceNote = profile.portraitProvenance.decision
    ?? profile.portraitProvenance.officialSearch
    ?? profile.portraitProvenance.officialCandidate

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link
        href="/"
        className="inline-flex text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        ← Back to annotations
      </Link>

      <article className="text-card-foreground">
        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <ProfilePortraitTooltip
            id={profile.id}
            name={profile.name}
            portraitPath={profile.portraitPath}
            portraitFallback={profile.portraitFallback}
            portraitObjectPosition={portraitObjectPosition}
            provenanceLabel={provenanceLabel}
            provenanceCredit={profile.portraitProvenance.credit}
            provenanceNote={provenanceNote}
            sourceUrl={profile.portraitProvenance.sourceUrl}
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.roles.join(' · ')}</p>
          </div>
        </header>

        <div className="mt-8 space-y-6">
          <section aria-label="About">
            <p className="leading-7 text-muted-foreground">{profile.biography}</p>
          </section>

          <section className="border-t pt-5" aria-label="Scripture profile content">
            <ProfileContentTabs
              initialTab={recentAnnotations?.length ? 'annotations' : 'passages'}
              annotations={recentAnnotations?.length ? (
                <ProfileAnnotations
                  annotations={recentAnnotations}
                  users={users}
                  currentUserId={currentUserId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No annotations have been attributed here yet.</p>
              )}
              passages={associatedPassages.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {associatedPassages.map((passage) => (
                    <li key={passage.ruleId}>
                      <Link
                        href={associatedPassageHref(passage)}
                        className="block rounded-md border p-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <span className="font-medium text-foreground">{associatedPassageTitle(passage)}</span>
                        <span className="mt-1 block text-xs leading-snug text-muted-foreground">{passage.evidence}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No associated passages have been identified.</p>
              )}
            />
          </section>

          {members.length > 0 && (
            <section className="border-t pt-5" aria-labelledby="members-heading">
              <h2 id="members-heading" className="text-lg font-semibold">Members</h2>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {members.map((member) => (
                  <li key={member.id}>
                    <Link
                      href={`/scripture-people/${encodeURIComponent(member.id)}`}
                      className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {member.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      </article>
    </main>
  )
}
