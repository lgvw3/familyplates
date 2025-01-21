'use server'

import clientPromise from "../mongodb";
import z from "zod";
import redis from "ioredis";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { fetchAccountById } from "../auth/accounts";
import { BookmarkedSpot } from "./definitions";

const zLastRead = z.object({
    verseNumber: z.number(),
    bookId: z.string(),
    chapterNumber: z.number(),
})

export async function saveBookmark(lastRead: BookmarkedSpot) {

    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        redirect('/sign-in')
    }
    const { userId } = validateToken(authToken);

    if (!userId) {
        return {
            message: "Unauthorized. This app is just for my family for now"
        }
    }
    const user = fetchAccountById(userId)

    if (!user) {
        return {
            message: "Unauthorized. This app is just for my family for now"
        }
    }

    const validatedFields = zLastRead.safeParse(lastRead)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create bookmark",
        };
    }

    const {verseNumber, chapterNumber, bookId} = validatedFields.data

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("bookmarks");

    const existing = await collection.findOne<BookmarkedSpot>({userId: userId})

    const updatedBookmark: BookmarkedSpot = {
        _id: null,
        verseNumber: verseNumber,
        chapterNumber: chapterNumber,
        bookId: bookId,
        userId: userId,
        lastRead: new Date()
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...bookmarkData} = updatedBookmark
        const result = await collection.updateOne({userId: userId}, {$set: bookmarkData}, {upsert: true});

        if (result.upsertedId || result.modifiedCount) {
            try {
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("bookmarks", JSON.stringify({
                    ...bookmarkData, 
                    _id: result.upsertedId ? result.upsertedId.toString() : existing?._id?.toString()
                }
                ));
                return {
                    message: 'Sucess',
                }
            }
            catch(err) {
                console.error(err)
                return {
                    message: `Real time update error: ${err}`
                }
            }
        }
        else {
            console.error("Database Error: Could not save bookmark.")
            return {
                message: "Database Error: Could not save annotation"
            }
        }
    } catch(error) {
        console.error(error)
        return {
            message: error
        }
    }
}