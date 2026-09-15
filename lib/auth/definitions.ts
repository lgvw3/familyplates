export interface UserAccount {
    id: number
    name: string
    avatar?: string | undefined
    email?: string | undefined
}

export interface FamilyMemberRecord {
    userId: number
    name: string
    normalizedEmails: string[]
    authUserId?: string
    enabled: boolean
    createdAt: Date
    updatedAt: Date
}

export type FamilyInteraction = {
    key: string
    kind: 'comment' | 'annotation-like' | 'comment-like'
    occurredAt: Date
    annotationId: string
    annotationAuthorName: string
    annotationText: string
    commentId?: string
    commentAuthorName?: string
    commentContent?: string
}
