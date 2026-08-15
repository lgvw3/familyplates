'use server'

import { Annotation } from "@/types/scripture";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";

function normalizeAnnotationIds(annotation: Annotation) {
    annotation._id = annotation._id ? annotation._id.toString() : null
    annotation.comments = annotation.comments?.map(comment => {
        comment._id = comment._id.toString()
        return comment
    }) ?? []
    annotation.likes = annotation.likes?.map(like => {
        like._id = like._id.toString()
        return like
    }) ?? []
    return annotation
}

export async function fetchAllAnnotations(skipAuth: boolean = false) {
    if (!skipAuth) {
        const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
        if (!authToken) {
            redirect('/sign-in')
        }
        const { userId } = validateToken(authToken);

        if (!userId) {
            return null
        }
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    try {
        const results = await collection.find<Annotation>({}).toArray();
        if (results) {
            results.forEach(normalizeAnnotationIds)
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
        const results = await collection.find<Annotation>({}).sort({ createdAt: -1, _id: -1 }).limit(10).toArray();
        if (results) {
            results.forEach(normalizeAnnotationIds)
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
        const createdAt = new Date(lastAnnotation.createdAt)
        if (Number.isNaN(createdAt.getTime())) {
            throw new Error('Invalid annotation pagination cursor')
        }

        const lastId = lastAnnotation._id?.toString()
        const cursorId = lastId && ObjectId.isValid(lastId) ? new ObjectId(lastId) : null
        const cursor = cursorId
            ? {
                $or: [
                    { createdAt: { $lt: createdAt } },
                    { createdAt, _id: { $lt: cursorId } },
                ],
            }
            : { createdAt: { $lt: createdAt } }

        const results = await collection.find<Annotation>(cursor)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .toArray();

        if (results) {
            results.forEach(normalizeAnnotationIds)
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

    try {
        const client = await clientPromise;
        const db = client.db("main");
        const collection = db.collection("annotations");

        const results = await collection.find<Annotation>({
            "target.kind": "scripture",
            "target.bookId": book,
            "target.chapterNumber": chapter,
        }).toArray();

        if (results) {
            results.forEach(normalizeAnnotationIds)
            return results
        }
        else {
            return null
        }
    } catch(error) {
        console.error('Error fetching annotations by chapter:', error)
        return null
    }
}

export async function fetchAnnotationsByIntro(introId: string) {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) redirect('/sign-in')
    const { userId } = validateToken(authToken);
    if (!userId) return null

    try {
        const client = await clientPromise;
        const collection = client.db("main").collection("annotations");
        const results = await collection.find<Annotation>({
            "target.kind": "intro",
            "target.introId": introId,
        }).toArray();

        results.forEach(normalizeAnnotationIds)
        return results
    } catch (error) {
        console.error('Error fetching intro annotations:', error)
        return null
    }
}

export async function fetchAnnotationById(annotationId: string, skipAuth: boolean = false) {
    if (!skipAuth) {
        const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
        if (!authToken) {
            redirect('/sign-in')
        }
        const { userId } = validateToken(authToken);

        if (!userId) {
            return null
        }
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    try {
        const results = await collection.findOne<Annotation>(
            { _id: new ObjectId(annotationId) },
            // Only select fields needed for preview when skipAuth is true
            skipAuth ? {
                projection: {
                    _id: 1,
                    userId: 1,
                    target: 1,
                    text: 1,
                }
            } : {}
        );

        if (results) {
            results._id = results._id?.toString() ? results._id.toString() : ''
            if (!skipAuth) {
                results.comments?.map(c => c._id = c._id.toString())
                results.likes?.map(l => l._id = l._id.toString())
            }
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

export async function fetchAnnotationsByUser(userId: number, skipAuth: boolean = false) {
    if (!skipAuth) {
        const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
        if (!authToken) {
            redirect('/sign-in')
        }
        const { userId } = validateToken(authToken);

        if (!userId) {
            return null
        }
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    try {
        const results = await collection.find<Annotation>({ userId: userId }).toArray();

        if (results) {
            results.forEach(normalizeAnnotationIds)
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

/** Recent annotations where a scripture source is either the primary or secondary identity. */
export async function fetchAnnotationsByScripturePerson(profileId: string, limit: number = 25) {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) redirect('/sign-in')
    const { userId } = validateToken(authToken)
    if (!userId || !profileId) return null

    const normalizedLimit = Math.max(1, Math.min(Math.floor(limit), 100))
    try {
        const client = await clientPromise
        const collection = client.db('main').collection<Annotation>('annotations')
        const results = await collection.find({
            $or: [
                { 'scriptureAttribution.primaryProfileId': profileId },
                { 'scriptureAttribution.secondaryProfileId': profileId },
            ],
        }).sort({ createdAt: -1 }).limit(normalizedLimit).toArray()
        results.forEach(normalizeAnnotationIds)
        return results
    } catch (error) {
        console.error('Error fetching annotations by scripture person:', error)
        return null
    }
}
