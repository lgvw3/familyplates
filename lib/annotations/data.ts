'use server'

import { Annotation } from "@/types/scripture";
import clientPromise from "../mongodb";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";

export async function fetchRecentAnnotations() {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        redirect('/sign-in')
    }
    const { userId } = validateToken(authToken);

    if (!userId) {
        return null
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    // Save annotation to the database
    try {
        const results = await collection.find<Annotation>({}).sort({ createdAt: -1}).limit(10).toArray();
        if (results) {
            results.map(a => {
                a._id = a._id ? a._id.toString() : null
                a.comments = a.comments?.map(comment => {
                    comment._id = comment._id.toString()
                    return comment
                })
                a.likes?.map(like => {
                    like._id = like._id.toString()
                    return like
                })
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

export async function fetchMoreAnnotations(lastAnnotation: Annotation, limit: number) {
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

    try {
        const results = await collection.find<Annotation>({ createdAt: { $lt: lastAnnotation.createdAt } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

        if (results) {
            results.map(a => {
                a._id = a._id ? a._id.toString() : null
                a.comments = a.comments?.map(comment => {
                    comment._id = comment._id.toString()
                    return comment
                })
                a.likes?.map(like => {
                    like._id = like._id.toString()
                    return like
                })
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
    const db = client.db("main");
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