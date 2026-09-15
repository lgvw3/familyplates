import LoginFlow from '@/components/login-flow'
import { isGoogleAuthConfigured } from '@/lib/auth/auth'
import { getCurrentFamilyMember } from '@/lib/auth/current-user'
import { redirect } from 'next/navigation'

export const instant = false

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    if (await getCurrentFamilyMember()) redirect('/')
    const { error } = await searchParams
    return <LoginFlow googleConfigured={isGoogleAuthConfigured} error={error} />
}
