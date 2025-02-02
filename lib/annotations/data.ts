'use server'

import { Annotation } from "@/types/scripture";
import clientPromise from "../mongodb";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

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
    const db = client.db("main");
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

    try {
        const results = await collection.find<Annotation>({bookId: book, chapterNumber: chapter}).toArray();

        if (results) {
            results.map(a => {
                a._id = a._id ? a._id.toString() : null
                a.comments?.map(c => c._id = c._id.toString())
                a.likes?.map(l => l._id = l._id.toString())
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

export async function fetchAnnotationById(annotationId: string) {
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
        const results = await collection.findOne<Annotation>({_id: new ObjectId(annotationId)});

        if (results) {
            results._id = results._id?.toString() ? results._id.toString() : ''
            results.comments?.map(c => c._id = c._id.toString())
            results.likes?.map(l => l._id = l._id.toString())
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