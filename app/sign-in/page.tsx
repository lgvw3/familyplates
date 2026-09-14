import LoginFlow from "@/components/login-flow";
import { fetchFamilyAccounts } from '@/lib/auth/profiles'
import { connection } from 'next/server'

export const instant = false

export default async function Page() {
    await connection()
    const accounts = await fetchFamilyAccounts()
    return (
        <LoginFlow accounts={accounts} />
    )
}
