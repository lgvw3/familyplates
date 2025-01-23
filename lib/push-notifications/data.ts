'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateToken } from "../auth/utils";
import clientPromise from "../mongodb";
import { NotificationSubscription } from "./definitions";

export async function fetchUserNotificationSubscription() {
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
