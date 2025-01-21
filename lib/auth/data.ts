'use server'

export async function checkPassword(passwordGuess: string) {
    if (process.env.GLOBAL_PASSWORD == passwordGuess) {
        return true
    }
    return false
}