'use server'
 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import webpush from 'web-push'
import { validateToken } from '../auth/utils'
import clientPromise from '../mongodb'
import { NotificationSubscription } from './definitions'
 
webpush.setVapidDetails(
    process.env.VAPID_MAIL_ADDRESS!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)
 
let subscription: PushSubscription | null = null
 
export async function subscribeUser(sub: PushSubscription) {
    subscription = sub;

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

    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("notificationSubscriptions");

    const newSub: NotificationSubscription = {
        _id: null,
        userId: userId,
        sub: sub
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...subData} = newSub
        const results = await collection.insertOne(subData)
        if (results.insertedId) {
            return { success: true }
        } else {
            return { success: false }
        }

    } catch(error) {
        console.error(error)
        return {
            success: false
        }
    }
}
 
export async function unsubscribeUser() {
    subscription = null

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


    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("notificationSubscriptions");

    try {
        const results = await collection.deleteOne({userId: userId})
        if (results.deletedCount) {
            return { success: true }
        } else {
            return { success: false }
        }

    } catch(error) {
        console.error(error)
        return {
            success: false
        }
    }
}
 
export async function sendNotification(message: string, title: string) {
    if (!subscription) {
        throw new Error('No subscription available')
    }
    
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: title,
                body: message,
            })
        )
        return { success: true }
    } catch (error) {
        console.error('Error sending push notification:', error)
        return { success: false, error: 'Failed to send notification' }
    }
}