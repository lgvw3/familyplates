'use server'

import { UIMessage } from "ai";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateToken } from "../auth/utils";
import { fetchAccountById } from "../auth/accounts";
import clientPromise from "../mongodb";

export async function saveChatMessages(messages: UIMessage[], chatId: string) {

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
    const collection = db.collection("chats");


    // Save annotation to the database
    try {
        const result = await collection.updateOne({chatId: chatId}, { $set: {
            messages: messages,
            userId: userId,
            userName: user.name,
            updatedAt: new Date(),
        }}, {upsert: true});

        if (result.modifiedCount || result.upsertedId) {
            return {
                message: true
            }
        }
        else {
            console.error("Database Error: Could not save chat.")
            return {
                message: "Database Error: Could not save chat"
            }
        }
    } catch(error) {
        console.error(error)
        return {
            message: error
        }
    }
}