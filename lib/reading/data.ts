'use server'

import { requireCurrentFamilyMember } from "../auth/current-user";
import { BookmarkedSpot } from "./definitions";
import clientPromise from "../mongodb";

export async function fetchBookmarkBySignedInUser() {

    const user = await requireCurrentFamilyMember()
    const userId = user.id


    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("bookmarks");

    const existing = await collection.findOne<BookmarkedSpot>({userId: userId})

    if (existing) {
        existing._id = existing._id ? existing._id.toString() : existing._id
        return existing
    }
    else {
        return null
    }
}
