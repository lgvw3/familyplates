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
import { ObjectId, UpdateResult } from "mongodb";
import { sendNotificationToOfflineUsers } from "../push-notifications/actions";

const zAnnotation = z.object({
    verseNumber: z.number(),
    bookId: z.string(),
    chapterNumber: z.number(),
    text: z.string(),
    highlightedText: z.string(),
    type: z.enum(['note', 'link', 'photo', 'combo']),
    color: z.enum(['yellow', 'green', 'blue', 'purple', 'pink']),
    url: z.string().optional(),
    photoUrl: z.string().optional(),
    unboundAnnotation: z.boolean().optional()
})

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

    const validatedFields = zAnnotation.safeParse(annotation)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create annotation",
        };
    }

    const {verseNumber, chapterNumber, bookId, text, highlightedText, type, color, url, photoUrl, unboundAnnotation} = validatedFields.data

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("annotations");

    const newAnnotation: Annotation = {
        _id: null,
        verseNumber: verseNumber,
        chapterNumber: chapterNumber,
        bookId: bookId,
        text: text,
        highlightedText: highlightedText,
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

    if (unboundAnnotation) {
        newAnnotation.unboundAnnotation = true
    }

    // Save annotation to the database
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...annotationData} = newAnnotation
        const result = await collection.insertOne(annotationData);

        if (result.insertedId) {
            try {
                //real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("annotations", JSON.stringify({
                    ...annotationData, 
                    _id: result.insertedId.toString()
                }));

                // subscribers offline
                await sendNotificationToOfflineUsers(annotationData.text, `New annotation from ${annotationData.userName} `, userId)

                return {
                    message: 'Success',
                    insertedId: result.insertedId.toString(),
                    annotation: newAnnotation
                }
            }
            catch(err) {
                console.error(err)
                sendErrorMessageToMe(annotation)
                return {
                    message: `Real time update error: ${err}`
                }
            }
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
    content: z.string()
})

export async function addCommentToAnnotation(comment: string, annotationId: string) {

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

    const validatedFields = zComment.safeParse({content: comment})

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create annotation",
        };
    }

    const {content} = validatedFields.data

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection<Annotation>("annotations");

    const newComment: AnnotationComment = {
        _id: new ObjectId(),
        userId: userId,
        userName: user.name,
        content: content,
        timeStamp: new Date()
    }

    try {
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
            try {
                // real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("comments", JSON.stringify({
                    comment: newComment, 
                    annotationId: annotationId
                }));

                //offline
                await sendNotificationToOfflineUsers(newComment.content, `New comment from ${newComment.userName} `, userId)

                return {
                    message: 'Success',
                    newComment: {
                        ...newComment,
                        _id: newComment._id.toString()
                    }
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

export async function updateLikeStatusOfComment(currentUserId: number, annotationId: string, userLike: AnnotationLike | undefined) {
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
        let results: UpdateResult<Annotation>
        const existingAnnotation = await collection.findOne({_id: new ObjectId(annotationId)})
        if (userLike) {
            const existingLike = existingAnnotation?.likes?.find(val => val.userId == currentUserId)
            // User already liked: Unlike
            results = await collection.updateOne(
                { _id: new ObjectId(annotationId) },
                { $pull: { likes: existingLike} }
            );
        } else {
            // User not liked: Like
            results = await collection.updateOne(
                { _id: new ObjectId(annotationId) },
                { $addToSet: { likes: updatedLike } }
            );
        }

        if (results.modifiedCount) {
            try {
                // real time
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("likes", JSON.stringify({
                    like: updatedLike,
                    likes: !userLike,
                    annotationId: annotationId
                }));
                // offline
                if (!userLike) {
                    // liking it
                    await sendNotificationToOfflineUsers('', `${updatedLike.userName} liked ${existingAnnotation?.userName}'s thoughts `, userId)
                }
                return {
                    message: 'Success',
                    newLike: {
                        ...updatedLike,
                        _id: updatedLike._id.toString()
                    }
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
            console.error("Database Error: Could not update like. Failed insert.")
            return {
                message: "Database Error: Could not update like"
            }
        }
    } catch(error) {
        console.error(error)
        return {
            message: error
        }
    }
}
