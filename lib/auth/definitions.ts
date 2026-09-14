export interface UserAccount {
    id: number
    name: string
    avatar?: string | undefined
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
