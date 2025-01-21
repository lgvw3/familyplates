import { ObjectId } from "mongodb"

export type BookmarkedSpot = {
    _id: ObjectId | string | null,
    verseNumber: number,
    bookId: string,
    chapterNumber: number,
    userId: number,
    lastRead: Date
}