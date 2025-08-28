'use server'

import { getValidatedClient } from "../mongodb";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { fetchAccountById } from "../auth/accounts";
import { BookmarkedSpot } from "./definitions";

export async function fetchBookmarkBySignedInUser() {

    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        redirect('/sign-in')
    }
    const { userId } = validateToken(authToken);

    if (!userId) {
        return null
    }
    const user = fetchAccountById(userId)

    if (!user) {
        return null
    }


    const client = await getValidatedClient();
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