'use server'

import { Annotation } from "@/types/scripture";
import clientPromise from "../mongodb";
import z from "zod";
import redis from "ioredis";

const zAnnotation = z.object({
    verseNumber: z.number(),
    text: z.string(),
    highlightedText: z.string(),
    type: z.enum(['note', 'link', 'photo', 'combo']),
    color: z.enum(['yellow', 'green', 'blue', 'purple', 'pink']),
    url: z.string().optional(),
    photoUrl: z.string().optional()
})

export async function saveAnnotation(annotation: Annotation) {

    const validatedFields = zAnnotation.safeParse(annotation)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to create annotation",
        };
    }

    const {verseNumber, text, highlightedText, type, color, url, photoUrl} = validatedFields.data

    const client = await clientPromise;
    const db = client.db("main"); // Replace with your database name
    const collection = db.collection("annotations");

    const newAnnotation: Annotation = {
        _id: null,
        verseNumber: verseNumber,
        text: text,
        highlightedText: highlightedText,
        type: type,
        color: color,
        createdAt: new Date(),
        url: url,
        photoUrl: photoUrl
    }

    // Save annotation to the database
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...annotationData} = newAnnotation
        const result = await collection.insertOne(annotationData);

        if (result.insertedId) {
            try {
                const redisPub = new redis(process.env.KV_URL ?? '');
                await redisPub.publish("annotations", JSON.stringify({
                    type: "annotation",
                    data: {
                        ...annotationData, 
                        _id: result.insertedId.toString()
                    }
                }
                ));
                return {
                    message: 'Sucess',
                    insertedId: result.insertedId.toString()
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
            console.error("Database Error: Could not save annotation. Failed insert.")
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