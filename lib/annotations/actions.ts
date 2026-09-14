'use server'

import { Annotation, AnnotationComment, AnnotationLike } from "@/types/scripture";
import clientPromise from "../mongodb";
import z from "zod";
import redis from "ioredis";
import sendErrorMessageToMe from "../dev/actions";
import { cookies } from "next/headers";
import { validateToken } from "../auth/utils";
import { redirect } from "next/navigation";
import { fetchAccountById } from "../auth/accounts";
import { ObjectId } from "mongodb";
import { sendNotificationToOfflineUsers } from "../push-notifications/actions";
import { InvalidAttributionTargetError, resolveScriptureAttribution } from "../scripture-attribution/resolver.ts";

const zAnnotation = z.object({
    schemaVersion: z.literal(2),
    target: z.discriminatedUnion('kind', [
        z.object({
            kind: z.literal('scripture'),
            sourceVersion: z.literal('book-of-mormon-local-v1'),
            bookId: z.string().min(1),
            chapterNumber: z.number().int().positive(),
            start: z.object({ unit: z.number().int().positive(), offset: z.number().int().nonnegative() }),
            end: z.object({ unit: z.number().int().positive(), offset: z.number().int().nonnegative() }),
            quote: z.object({ exact: z.string().min(1), prefix: z.string().optional(), suffix: z.string().optional() }),
        }),
        z.object({
            kind: z.literal('intro'),
            sourceVersion: z.literal('book-of-mormon-local-v1'),
            introId: z.string().min(1),
            start: z.object({ unit: z.number().int().nonnegative(), offset: z.number().int().nonnegative() }),
            end: z.object({ unit: z.number().int().nonnegative(), offset: z.number().int().nonnegative() }),
            quote: z.object({ exact: z.string().min(1), prefix: z.string().optional(), suffix: z.string().optional() }),
        }),
    ]).nullable(),
    text: z.string(),
    type: z.enum(['note', 'link', 'photo']),
    color: z.enum(['yellow', 'green', 'blue', 'purple', 'pink']),
    url: z.string().optional(),
    photoUrl: z.string().optional(),
})

function serializeAnnotation(annotation: Annotation): Annotation {
    return {
        ...annotation,
        _id: annotation._id?.toString() ?? null,
        comments: (annotation.comments ?? []).map(comment => ({
            ...comment,
            _id: comment._id.toString(),
            parentCommentId: comment.parentCommentId?.toString(),
            likes: (comment.likes ?? []).map(like => ({ ...like, _id: like._id.toString() })),
        })),
        likes: (annotation.likes ?? []).map(like => ({ ...like, _id: like._id.toString() })),
    }
}

export async function saveAnnotation(annotation: Annotation) {

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

    // Extract first name
    const firstName = user.name.split(' ')[0]

    const validatedFields = zAnnotation.safeParse(annotation)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create annotation",
        };
    }

    const {target, text, type, color, url, photoUrl} = validatedFields.data

    // Attribution is always derived from the checked-in scripture text.  The
    // Zod schema intentionally excludes this field, so a browser cannot forge
    // a profile identity or recorder relationship.
    let scriptureAttribution
    try {
        scriptureAttribution = target ? resolveScriptureAttribution(target) : undefined
    } catch (error) {
        const message = error instanceof InvalidAttributionTargetError
            ? error.message
            : 'Unable to verify the selected scripture text'
        return {
            errors: { target: [message] },
            message: 'Invalid scripture selection. Failed to create annotation',
        }
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    const newAnnotation: Annotation = {
        _id: null,
        schemaVersion: 2,
        target,
        ...(scriptureAttribution ? { scriptureAttribution } : {}),
        text: text,
        type: type,
        color: color,
        createdAt: new Date(),
        url: url,
        photoUrl: photoUrl,
        userId: userId,
        userName: user.name,
        comments: [],
        likes: []
    }

    // Save annotation to the database
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...annotationData} = newAnnotation
        const result = await collection.insertOne(annotationData);

        if (result.insertedId) {
            const savedAnnotation = serializeAnnotation({ ...newAnnotation, _id: result.insertedId })
            try {
                //real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("annotations", JSON.stringify({
                    ...annotationData, 
                    _id: result.insertedId.toString()
                }));

                // subscribers offline
                await sendNotificationToOfflineUsers(
                    annotationData.text,
                    `New annotation from ${firstName}`,
                    userId,
                    `/annotation/${result.insertedId.toString()}`,
                )

            }
            catch(err) {
                console.error('Annotation notification failed:', err)
            }
            return { message: 'Success', insertedId: result.insertedId.toString(), annotation: savedAnnotation }
        }
        else {
            console.error("Database Error: Could not save annotation. Failed insert.")
            sendErrorMessageToMe(annotation)
            return {
                message: "Database Error: Could not save annotation"
            }
        }
    } catch(error) {
        console.error(error)
        sendErrorMessageToMe(annotation)
        return {
            message: error
        }
    }
}

export async function updateAnnotation(annotationId: string, editedText: string) {

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

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");


    // Save annotation to the database
    try {
        const result = await collection.updateOne({_id: new ObjectId(annotationId)}, { $set: {
            text: editedText
        }});

        if (result.modifiedCount) {
            return {
                message: 'Success',
            }
        }
        else {
            console.error("Database Error: Could not save edit.")
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

const zComment = z.object({
    content: z.string().trim().min(1).max(4000),
    parentCommentId: z.string().optional(),
})

export async function addCommentToAnnotation(comment: string, annotationId: string, parentCommentId?: string) {

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

    const validatedFields = zComment.safeParse({content: comment, parentCommentId})

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create comment",
        };
    }

    const {content} = validatedFields.data

    if (!ObjectId.isValid(annotationId) || (parentCommentId && !ObjectId.isValid(parentCommentId))) {
        return { message: 'Invalid comment destination' }
    }

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection<Annotation>("annotations");

    const newComment: AnnotationComment = {
        _id: new ObjectId(),
        userId: userId,
        userName: user.name,
        content: content,
        timeStamp: new Date(),
        ...(parentCommentId ? { parentCommentId: new ObjectId(parentCommentId) } : {}),
        likes: [],
    }

    try {
        if (parentCommentId) {
            const parentExists = await collection.findOne({
                _id: new ObjectId(annotationId),
                'comments._id': new ObjectId(parentCommentId),
            }, { projection: { _id: 1 } })
            if (!parentExists) return { message: 'The comment you are replying to no longer exists' }
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(annotationId) },
            {
              $push: {
                comments: {
                  ...newComment
                }
              }
            }
        );

        if (result.modifiedCount) {
            const savedAnnotation = await collection.findOne({ _id: new ObjectId(annotationId) })
            try {
                // real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("comments", JSON.stringify({
                    comment: newComment, 
                    annotationId: annotationId
                }));

                //offline
                const firstName = newComment.userName.split(' ')[0]
                const commentId = newComment._id.toString()
                await sendNotificationToOfflineUsers(
                    newComment.content,
                    parentCommentId ? `${firstName} replied to a comment` : `New comment from ${firstName}`,
                    userId,
                    `/annotation/${annotationId}?comment=${commentId}#comment-${commentId}`,
                )

            }
            catch(err) {
                console.error('Comment notification failed:', err)
            }
            return {
                message: 'Success',
                newComment: { ...newComment, _id: newComment._id.toString() },
                annotation: savedAnnotation ? serializeAnnotation(savedAnnotation) : undefined,
            }
        }
        else {
            console.error("Database Error: Could not save comment. Failed insert.")
            return {
                message: "Database Error: Could not save comment"
            }
        }
    } catch(error) {
        console.error(error)
        return {
            message: error
        }
    }
}

export async function setAnnotationLiked(annotationId: string, liked: boolean) {
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

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection<Annotation>("annotations");

    const updatedLike: AnnotationLike = {
        _id: new ObjectId(),
        userId: userId,
        userName: user.name,
        timeStamp: new Date()
    }

    try {
        if (!ObjectId.isValid(annotationId)) return { message: 'Invalid annotation' }
        const existingAnnotation = await collection.findOne({_id: new ObjectId(annotationId)})
        if (!existingAnnotation) return { message: 'Annotation not found' }
        if (liked) {
            await collection.updateOne(
                { _id: new ObjectId(annotationId), 'likes.userId': { $ne: userId } },
                { $push: { likes: updatedLike } },
            )
        } else {
            await collection.updateOne(
                { _id: new ObjectId(annotationId) },
                { $pull: { likes: { userId } } },
            )
        }
        const savedAnnotation = await collection.findOne({ _id: new ObjectId(annotationId) })
        if (!savedAnnotation) return { message: 'Annotation not found' }
        try {
                // real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("likes", JSON.stringify({
                    like: updatedLike,
                    likes: liked,
                    annotationId: annotationId
                }));
                // offline
                if (liked) {
                    // liking it
                    const firstName = updatedLike.userName.split(' ')[0]
                    const annotationAuthorFirstName = existingAnnotation?.userName.split(' ')[0]
                    await sendNotificationToOfflineUsers('', `${firstName} liked ${annotationAuthorFirstName}'s thoughts`, userId, `/annotation/${annotationId}`)
                }
        } catch(err) {
            console.error('Like notification failed:', err)
        }
        return { message: 'Success', annotation: serializeAnnotation(savedAnnotation) }
    } catch(error) {
        console.error(error)
        return {
            message: error
        }
    }
}

export async function setCommentLiked(annotationId: string, commentId: string, liked: boolean) {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value
    if (!authToken) redirect('/sign-in')
    const { userId } = validateToken(authToken)
    if (!userId) return { message: 'Unauthorized. This app is just for my family for now' }
    const user = fetchAccountById(userId)
    if (!user) return { message: 'Unauthorized. This app is just for my family for now' }
    if (!ObjectId.isValid(annotationId) || !ObjectId.isValid(commentId)) {
        return { message: 'Invalid comment' }
    }

    const client = await clientPromise
    const collection = client.db('main').collection<Annotation>('annotations')
    const annotation = await collection.findOne({ _id: new ObjectId(annotationId) })
    const comment = annotation?.comments?.find(item => item._id.toString() === commentId)
    if (!comment) return { message: 'Comment not found' }

    const newLike: AnnotationLike = {
        _id: new ObjectId(),
        userId,
        userName: user.name,
        timeStamp: new Date(),
    }

    if (liked) {
        await collection.updateOne(
            {
                _id: new ObjectId(annotationId),
                comments: { $elemMatch: { _id: new ObjectId(commentId), 'likes.userId': { $ne: userId } } },
            },
            { $push: { 'comments.$.likes': newLike } },
        )
    } else {
        await collection.updateOne(
            { _id: new ObjectId(annotationId) },
            { $pull: { 'comments.$[comment].likes': { userId } } },
            { arrayFilters: [{ 'comment._id': new ObjectId(commentId) }] },
        )
    }
    const savedAnnotation = await collection.findOne({ _id: new ObjectId(annotationId) })
    if (!savedAnnotation) return { message: 'Annotation not found' }

    try {
        const redisPub = new redis(process.env.KV_URL ?? '')
        await redisPub.publish('commentLikes', JSON.stringify({
            annotationId,
            commentId,
            like: newLike,
            likes: liked,
        }))
        if (liked) {
            const firstName = user.name.split(' ')[0]
            await sendNotificationToOfflineUsers(
                '',
                `${firstName} liked ${comment.userName.split(' ')[0]}'s comment`,
                userId,
                `/annotation/${annotationId}?comment=${commentId}#comment-${commentId}`,
            )
        }
    } catch (error) {
        console.error('Comment like notification failed:', error)
    }

    return {
        message: 'Success',
        annotation: serializeAnnotation(savedAnnotation),
    }
}

export async function markFeedActivitiesSeen(activityKeys: string[]) {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value
    if (!authToken) redirect('/sign-in')
    const { userId } = validateToken(authToken)
    if (!userId) return { message: 'Unauthorized' }

    const keys = [...new Set(activityKeys)].filter(key => /^(annotation|comment):[a-f\d]{24}$/i.test(key))
    if (!keys.length) return { message: 'Success' }

    const client = await clientPromise
    const collection = client.db('main').collection('activityViews')
    await collection.createIndex({ userId: 1, activityKey: 1 }, { unique: true })
    const firstSeenAt = new Date()
    await collection.bulkWrite(keys.map(activityKey => ({
        updateOne: {
            filter: { userId, activityKey },
            update: { $setOnInsert: { userId, activityKey, firstSeenAt } },
            upsert: true,
        },
    })), { ordered: false })

    return { message: 'Success' }
}
