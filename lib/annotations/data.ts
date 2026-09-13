'use server'

import { Annotation } from "@/types/scripture";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";
import type { FeedActivity, FeedCursor, FeedPage } from "@/types/feed";

function normalizeAnnotationIds(annotation: Annotation) {
    annotation._id = annotation._id ? annotation._id.toString() : null
    annotation.comments = annotation.comments?.map(comment => {
        comment._id = comment._id.toString()
        comment.parentCommentId = comment.parentCommentId?.toString()
        comment.likes = comment.likes?.map(like => ({
            ...like,
            _id: like._id.toString(),
        })) ?? []
        return comment
    }) ?? []
    annotation.likes = annotation.likes?.map(like => {
        like._id = like._id.toString()
        return like
    }) ?? []
    return annotation
}

function annotationActivityKey(annotationId: string) {
    return `annotation:${annotationId}`
}

function commentActivityKey(commentId: string) {
    return `comment:${commentId}`
}

type ActivityView = {
    userId: number;
    activityKey: string;
    firstSeenAt: Date;
}

function compareFeedActivities(a: FeedActivity, b: FeedActivity) {
    if (a.unseen !== b.unseen) return a.unseen ? -1 : 1
    const timeDifference = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    return timeDifference || b.key.localeCompare(a.key)
}

function isAfterCursor(activity: FeedActivity, cursor: FeedCursor) {
    if (activity.unseen !== cursor.unseen) return !activity.unseen && cursor.unseen
    const activityTime = new Date(activity.occurredAt).getTime()
    const cursorTime = new Date(cursor.occurredAt).getTime()
    if (activityTime !== cursorTime) return activityTime < cursorTime
    return activity.key.localeCompare(cursor.key) < 0
}

/**
 * Personalized home feed. New annotations are shown as threads (with their
 * comments); once the annotation has been seen, each new comment
 * becomes its own activity with reply context.
 */
export async function fetchFeedPage({
    limit = 15,
    cursor,
    sessionStartedAt,
}: {
    limit?: number;
    cursor?: FeedCursor | null;
    sessionStartedAt: string;
}): Promise<FeedPage | null> {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value
    if (!authToken) redirect('/sign-in')
    const { userId } = validateToken(authToken)
    if (!userId) return null

    const sessionStart = new Date(sessionStartedAt)
    if (Number.isNaN(sessionStart.getTime())) throw new Error('Invalid feed session time')

    try {
        const client = await clientPromise
        const db = client.db('main')
        const annotations = await db.collection('annotations')
            .find<Annotation>({})
            .sort({ createdAt: -1, _id: -1 })
            .toArray()
        annotations.forEach(normalizeAnnotationIds)

        const views = await db.collection<ActivityView>('activityViews')
            .find({ userId })
            .toArray()
        const firstSeenByKey = new Map(views.map(view => [view.activityKey, new Date(view.firstSeenAt)]))
        const wasUnseenAtSessionStart = (key: string, authorId: number) => {
            if (authorId === userId) return false
            const firstSeenAt = firstSeenByKey.get(key)
            return !firstSeenAt || firstSeenAt > sessionStart
        }

        const activities: FeedActivity[] = []
        for (const annotation of annotations) {
            const annotationId = annotation._id?.toString()
            if (!annotationId) continue
            const annotationKey = annotationActivityKey(annotationId)
            const annotationUnseen = wasUnseenAtSessionStart(annotationKey, annotation.userId)
            const comments = annotation.comments ?? []
            const unseenComments = comments.filter(comment =>
                wasUnseenAtSessionStart(commentActivityKey(comment._id.toString()), comment.userId)
            )

            if (annotationUnseen) {
                const latestUnseenAt = unseenComments.reduce(
                    (latest, comment) => Math.max(latest, new Date(comment.timeStamp).getTime()),
                    new Date(annotation.createdAt).getTime(),
                )
                activities.push({
                    key: annotationKey,
                    kind: 'annotation',
                    occurredAt: new Date(latestUnseenAt),
                    unseen: true,
                    seenKeys: [annotationKey],
                    annotation,
                    contextComments: comments,
                })
                continue
            }

            if (unseenComments.length) {
                const byId = new Map(comments.map(comment => [comment._id.toString(), comment]))
                for (const comment of unseenComments) {
                    const parentComment = comment.parentCommentId
                        ? byId.get(comment.parentCommentId.toString())
                        : undefined
                    activities.push({
                        key: commentActivityKey(comment._id.toString()),
                        kind: 'comment',
                        occurredAt: new Date(comment.timeStamp),
                        unseen: true,
                        seenKeys: [commentActivityKey(comment._id.toString())],
                        annotation,
                        comment,
                        parentComment,
                    })
                }
                continue
            }

            activities.push({
                key: annotationKey,
                kind: 'annotation',
                occurredAt: new Date(annotation.createdAt),
                unseen: false,
                seenKeys: [annotationKey],
                annotation,
            })
        }

        const ordered = activities.sort(compareFeedActivities)
        const remaining = cursor ? ordered.filter(activity => isAfterCursor(activity, cursor)) : ordered
        const items = remaining.slice(0, limit)
        const last = items.at(-1)
        const nextCursor = remaining.length > items.length && last ? {
            unseen: last.unseen,
            occurredAt: new Date(last.occurredAt).toISOString(),
            key: last.key,
        } : null

        return { items, nextCursor }
    } catch (error) {
        console.error('Error fetching personalized feed:', error)
        return null
    }
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
            normalizeAnnotationIds(results)
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
