'use server'

import { UIMessage } from "ai";
import { requireCurrentFamilyMember } from "../auth/current-user";
import clientPromise, { getMongoDatabase } from "../mongodb";

export async function saveChatMessages(messages: UIMessage[], chatId: string) {

    const user = await requireCurrentFamilyMember()
    const userId = user.id

    const client = await clientPromise;
    const db = getMongoDatabase(client);
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
