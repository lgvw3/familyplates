'use client'

import type { UserAccount } from '@/lib/auth/definitions'
import type { Annotation } from '@/types/scripture'
import AnnotationViewer from '@/components/feed/annotation-viewer'

type ProfileAnnotationsProps = {
  annotations: Annotation[]
  users: UserAccount[]
  currentUserId: number
}

export function ProfileAnnotations({ annotations, users, currentUserId }: ProfileAnnotationsProps) {
  const userMap = new Map(users.map((user) => [user.id, user]))

  return (
    <div>
      {annotations.map((annotation) => {
        const author = userMap.get(annotation.userId) ?? {
          id: annotation.userId,
          name: annotation.userName,
        }

        return (
          <AnnotationViewer
            key={annotation._id?.toString()}
            author={author}
            annotation={annotation}
            userMap={userMap}
            currentUserId={currentUserId}
            annotationHref={`/annotation/${annotation._id?.toString()}`}
            flat
          />
        )
      })}
    </div>
  )
}
