'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserAccount } from '@/lib/auth/definitions'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchAccountById } from '@/lib/auth/accounts'
import { getInitials } from '@/lib/utils'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'

export default function NewAnnotationPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [user, setUser] = useState<UserAccount>()
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const getUserData = async () => {
      const id = await fetchCurrentUserId()
      if (id) setUser(fetchAccountById(id))
    }
    void getUserData()
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const handleSave = async () => {
    if (!user || !text.trim() || saving) return

    setSaving(true)
    const result = await saveAnnotation({
      _id: null,
      schemaVersion: 2,
      target: null,
      text: text.trim(),
      type: 'note',
      color: 'yellow',
      createdAt: new Date(),
      userId: user.id,
      userName: user.name,
      comments: [],
      likes: [],
    })

    if (!result.insertedId) {
      toast.warning('Sharing annotation failed')
      setSaving(false)
      return
    }

    toast.success('Note shared with the family!')
    router.back()
  }

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Cancel
        </Button>
        <span className="text-sm font-semibold">New annotation</span>
        <Button type="button" size="sm" onClick={handleSave} disabled={!text.trim() || !user || saving}>
          {saving ? <Loader2Icon className="size-4 animate-spin" /> : 'Share'}
        </Button>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
        <div className="mb-5 flex shrink-0 items-center gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user?.name ?? 'Your annotation'}</span>
        </div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What’s on your mind?"
          className="min-h-[60vh] w-full flex-1 resize-none overflow-y-auto border-0 p-0 text-lg shadow-none focus-visible:ring-0"
          data-testid="unbound-annotation-page-textarea"
        />
      </main>
    </div>
  )
}
