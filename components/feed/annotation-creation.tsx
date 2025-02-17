'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { UserAccount } from '@/lib/auth/definitions'
import { fetchCurrentUserId } from '@/lib/auth/data'
import { fetchAccountById } from '@/lib/auth/accounts'
import { getInitials } from '@/lib/utils'
import { saveAnnotation } from '@/lib/annotations/actions'
import { toast } from 'sonner'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'

export function AnnotationCreation({ annotationCreated }: {annotationCreated: () => void}) {
  const [text, setText] = useState('')
  const [user, setUser] = useState<UserAccount>()

  const handleSave = async () => {
    if (user) {
      const results = await saveAnnotation({
        _id: null,
        verseNumber: 0,
        chapterNumber: 0,
        bookId: '',
        text: text,
        highlightedText: '',
        type: 'note',
        color: 'yellow',
        createdAt: new Date(),
        userId: user.id,
        userName: user.name,
        unboundAnnotation: true,
        comments: [],
        likes: []
      })
      if (!results.insertedId) {
        toast.warning("Sharing annotation failed")
      }
      else {
        annotationCreated()
      }
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

  return (
    <Card className="overflow-auto rounded-b-none">
      <CardContent className='flex items-start p-3 gap-4'>
        <Avatar className='ml-3 flex-shrink-0'>
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div className='w-full'>
          <AutoResizeTextarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your insights"
            maxHeight={100}
            canGoFullScreen={false}
          />

          <Button onClick={handleSave} className="w-full">
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

