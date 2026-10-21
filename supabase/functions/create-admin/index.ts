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
        return jsonResponse({ error: 'Account creation is not configured.' }, 500)
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

    const input = body as Record<string, unknown>
    const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : ''
    const lastName = typeof input.lastName === 'string' ? input.lastName.trim() : ''
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const contactNumber = typeof input.contactNumber === 'string' && input.contactNumber.trim()
        ? input.contactNumber.trim()
        : null
    const password = typeof input.password === 'string' ? input.password : ''

    if (!firstName || !lastName || !email || !password) {
        return jsonResponse({ error: 'First name, last name, email, and password are required.' }, 400)
    }
    if (firstName.length > 50 || lastName.length > 50 || email.length > 100 || (contactNumber?.length ?? 0) > 15) {
        return jsonResponse({ error: 'One or more fields exceed the allowed length.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: 'Enter a valid email address.' }, 400)
    }
    if (password.length < 8 || password.length > 128) {
        return jsonResponse({ error: 'Password must be between 8 and 128 characters.' }, 400)
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
        return jsonResponse({ error: 'Only administrators can create admin accounts.' }, 403)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: createdAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
    })

    if (createAuthError || !createdAuthUser.user) {
        console.error('Error creating admin Auth user:', createAuthError)
        return jsonResponse({ error: createAuthError?.message ?? 'Could not create the authentication account.' }, 400)
    }

    const profileFields = {
        role_id: 1,
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contactNumber,
        auth_user_id: createdAuthUser.user.id,
    }
    const { data: existingProfile, error: lookupError } = await adminClient
        .from('users')
        .select('user_id')
        .eq('auth_user_id', createdAuthUser.user.id)
        .maybeSingle()

    let profileId: number | null = null
    let profileError = lookupError

    if (!lookupError && existingProfile) {
        const { data: updatedProfile, error } = await adminClient
            .from('users')
            .update(profileFields)
            .eq('auth_user_id', createdAuthUser.user.id)
            .select('user_id')
            .single()
        profileId = updatedProfile?.user_id ?? null
        profileError = error
    } else if (!lookupError) {
        const { data: insertedProfile, error } = await adminClient
            .from('users')
            .insert(profileFields)
            .select('user_id')
            .single()
        profileId = insertedProfile?.user_id ?? null
        profileError = error
    }

    if (profileError || !profileId) {
        console.error('Error creating or promoting admin profile; removing newly created Auth user:', profileError)
        const { error: profileRollbackError } = await adminClient
            .from('users')
            .delete()
            .eq('auth_user_id', createdAuthUser.user.id)
        if (profileRollbackError) {
            console.error('Could not roll back newly created admin profile:', profileRollbackError)
        }
        const { error: rollbackError } = await adminClient.auth.admin.deleteUser(createdAuthUser.user.id)
        if (rollbackError) {
            console.error('Could not roll back newly created Auth user:', rollbackError)
        }
        return jsonResponse({ error: 'Could not create the admin profile. No account was added; check for an existing email.' }, 400)
    }

    return jsonResponse({ user_id: profileId }, 201)
})
