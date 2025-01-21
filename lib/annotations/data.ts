'use server'

import { Annotation } from "@/types/scripture";
import clientPromise from "../mongodb";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";

export async function fetchAnnotationsByChapter(book: string, chapter: number) {

    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        redirect('/sign-in')
    }
    const { userId } = validateToken(authToken);

    if (!userId) {
        return null
    }


    const client = await clientPromise;
    const db = client.db("main"); // Replace with your database name
    const collection = db.collection("annotations");

    // Save annotation to the database
    try {
        const results = await collection.find<Annotation>({bookId: book, chapterNumber: chapter}).toArray();

        if (results) {
            results.map(a => {
                a._id = a._id ? a._id.toString() : null
            })
            return results
        }
        else {
            return null
        }
    } catch(error) {
        console.error(error)
        return null
    }
}