'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { UserAccount } from '@/lib/auth/definitions'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchAccountById } from '@/lib/auth/accounts'
import { getInitials } from '@/lib/utils'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { PlusIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function AnnotationCreation({ renderTrigger }: { renderTrigger?: (onOpen: () => void) => ReactNode }) {
  const [text, setText] = useState('')
  const [user, setUser] = useState<UserAccount>()
  const [isOpen, setIsOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSave = async () => {
    if (!user || !text.trim()) return

    const results = await saveAnnotation({
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
      likes: []
    })
    if (!results.insertedId) {
      toast.warning("Sharing annotation failed")
    }
    else {
      setText('')
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const getUserData = async () => {
      const id = await fetchCurrentUserId()
      if (id) {
        const user = fetchAccountById(id)
        setUser(user)
      }
    }
    getUserData()
  }, [])

  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 639px)').matches) return

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  return (
    <>
      {renderTrigger ? renderTrigger(() => setIsOpen(true)) : (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg shadow-black/25"
          aria-label="Create an unbound annotation"
          title="Create an unbound annotation"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="size-7" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            textareaRef.current?.focus({ preventScroll: true })
          }}
          className="inset-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto overscroll-contain rounded-none border-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] !animate-none !duration-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(650px,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:overflow-hidden sm:rounded-lg sm:border sm:p-6"
        >
          <DialogHeader className="shrink-0 pr-10 text-left">
            <DialogTitle>Create an annotation</DialogTitle>
            <DialogDescription>
              Share a thought with the family without linking it to a specific passage.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-6 sm:min-h-0 sm:flex-1">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 font-medium">{user?.name ?? 'Your annotation'}</span>
              <Button onClick={handleSave} disabled={!text.trim() || !user} aria-label="Share annotation">
                Share
              </Button>
            </div>
            <Textarea
              autoFocus
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What’s on your mind?"
              className="min-h-[50dvh] flex-none resize-none p-4 text-lg sm:min-h-0 sm:flex-1"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
