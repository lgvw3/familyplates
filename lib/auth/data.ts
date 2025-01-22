'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateToken } from "./utils";

export async function checkPassword(passwordGuess: string) {
    if (process.env.GLOBAL_PASSWORD == passwordGuess) {
        return true
    }
    return false
}

export async function fetchCurrentUserId() {
    const authToken = (await cookies()).get('familyPlatesAuthToken')?.value;
    if (!authToken) {
        redirect('/sign-in')
    }
    const { userId } = validateToken(authToken);
    return userId
}