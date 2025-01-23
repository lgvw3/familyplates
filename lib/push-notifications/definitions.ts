import { ObjectId } from "mongodb"

export type NotificationSubscription = {
    _id: ObjectId | string | null,
    userId: number,
    sub: PushSubscription
}