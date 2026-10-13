import { supabase } from './supabase'

export async function isCurrentUserAdmin() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data, error } = await supabase
        .from('users')
        .select('role_id')
        .eq('auth_user_id', user.id)
        .eq('role_id', 1)
        .maybeSingle()

    if (error) {
        console.error('Error checking administrator role:', error)
        return false
    }

    return Boolean(data)
}
