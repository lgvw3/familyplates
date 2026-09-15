'use server'

import { requireCurrentFamilyMember } from './current-user'

export async function fetchCurrentUserId() {
    return (await requireCurrentFamilyMember()).id
}
