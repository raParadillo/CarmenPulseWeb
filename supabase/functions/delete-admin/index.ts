import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed.' }, 405)
    }

    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Authentication is required.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        console.error('Required Supabase Edge Function environment variables are missing.')
        return jsonResponse({ error: 'Account deletion is not configured.' }, 500)
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400)
    }
    if (typeof body !== 'object' || body === null) {
        return jsonResponse({ error: 'Request body must be a JSON object.' }, 400)
    }

    const userId = (body as Record<string, unknown>).userId
    if (typeof userId !== 'number' || !Number.isSafeInteger(userId) || userId < 1) {
        return jsonResponse({ error: 'A valid admin user ID is required.' }, 400)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
        return jsonResponse({ error: 'Your session is invalid or expired. Please sign in again.' }, 401)
    }

    const { data: isAdmin, error: adminCheckError } = await callerClient.rpc('is_admin')
    if (adminCheckError) {
        console.error('Error checking caller admin access:', adminCheckError)
        return jsonResponse({ error: 'Could not verify administrator permissions.' }, 500)
    }
    if (isAdmin !== true) {
        return jsonResponse({ error: 'Only administrators can delete admin accounts.' }, 403)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: target, error: targetError } = await adminClient
        .from('users')
        .select('user_id, role_id, auth_user_id')
        .eq('user_id', userId)
        .maybeSingle()

    if (targetError) {
        console.error('Error looking up admin to delete:', targetError)
        return jsonResponse({ error: 'Could not find the admin account.' }, 500)
    }
    if (!target || target.role_id !== 1) {
        return jsonResponse({ error: 'The requested admin account was not found.' }, 404)
    }
    if (target.auth_user_id === user.id) {
        return jsonResponse({ error: 'You cannot delete the account you are currently signed in with.' }, 400)
    }

    if (target.auth_user_id) {
        const { error: unlinkError } = await adminClient
            .from('users')
            .update({ auth_user_id: null })
            .eq('user_id', target.user_id)
            .eq('auth_user_id', target.auth_user_id)

        if (unlinkError) {
            console.error('Error unlinking admin profile before Auth deletion:', unlinkError)
            return jsonResponse({ error: 'Could not prepare the admin account for deletion.' }, 500)
        }

        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(target.auth_user_id)
        if (authDeleteError) {
            console.error('Error deleting admin Auth user:', authDeleteError)
            const { error: relinkError } = await adminClient
                .from('users')
                .update({ auth_user_id: target.auth_user_id })
                .eq('user_id', target.user_id)
            if (relinkError) {
                console.error('Could not restore admin profile Auth link:', relinkError)
                return jsonResponse({
                    error: 'Auth deletion failed and the profile link could not be restored. Contact the administrator.',
                }, 500)
            }
            return jsonResponse({ error: 'Could not delete the administrator sign-in account.' }, 500)
        }
    }

    const { error: profileDeleteError } = await adminClient
        .from('users')
        .delete()
        .eq('user_id', target.user_id)

    if (profileDeleteError) {
        console.error('Admin Auth access deleted, but profile has dependent records:', profileDeleteError)
        const { error: disableProfileError } = await adminClient
            .from('users')
            .update({ role_id: null, auth_user_id: null })
            .eq('user_id', target.user_id)

        if (disableProfileError) {
            console.error('Could not deactivate remaining admin profile:', disableProfileError)
            return jsonResponse({
                error: 'Sign-in was removed, but the linked profile could not be deleted or deactivated. Contact the administrator.',
            }, 500)
        }

        return jsonResponse({
            deleted: true,
            profileRetained: true,
        }, 200)
    }

    return jsonResponse({ deleted: true, profileRetained: false }, 200)
})
