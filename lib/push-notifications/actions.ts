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
            JSON.parse(JSON.stringify(subscription)),
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

export async function sendNotificationToOfflineUsers(message: string, title: string, authorId: number) {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        return
    }
    const { userId } = validateToken(authToken);

    if (!userId) {
        return
    }

    // TODO: Make this for people who are not online only

    try {
        const client = await clientPromise;
        const db = client.db("main");
        const collection = db.collection("notificationSubscriptions");

        const subs = await collection.find<NotificationSubscription>({}).toArray()
        const notificationPromises: Promise<webpush.SendResult>[] = []
        
        subs.map(sub => {
            if (process.env.NODE_ENV != 'production') {
                //dev
                if (sub.userId == 8) {// me for now
                    notificationPromises.push(webpush.sendNotification(
                        JSON.parse(JSON.stringify(sub.sub)),
                        JSON.stringify({
                            title: title,
                            body: message,
                        })
                    ))
                }
            }
            else if (sub.userId != authorId) {
                // do not bother them while i'm in dev mode lol
                notificationPromises.push(webpush.sendNotification(
                    JSON.parse(JSON.stringify(sub.sub)),
                    JSON.stringify({
                        title: title,
                        body: message,
                    })
                ))
            }
        })

        await Promise.all(notificationPromises)
    } catch(error) {
        console.error(error)
    }
}
