'use server'

import { requireCurrentFamilyMember } from "../auth/current-user";
import { NotificationSubscription } from "./definitions";
import clientPromise, { getMongoDatabase } from "../mongodb";

export async function fetchUserNotificationSubscription() {
    const user = await requireCurrentFamilyMember()
    const userId = user.id

    const client = await clientPromise;
    const db = getMongoDatabase(client);
    const collection = db.collection("notificationSubscriptions");

    try {
        const results = await collection.findOne<NotificationSubscription>({userId: userId})
        if (results) {
            results._id = results._id ? results._id.toString() : null
            return results
        } else {
            return null
        }

    } catch(error) {
        console.error(error)
        return null
    }
}
