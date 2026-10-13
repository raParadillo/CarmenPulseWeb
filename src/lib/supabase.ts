import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('your-supabase-url')) {
    throw new Error('VITE_SUPABASE_URL is missing or still uses the placeholder value in .env.local')
}

if (!supabaseAnonKey || supabaseAnonKey.includes('******')) {
    throw new Error('VITE_SUPABASE_ANON_KEY is missing or still uses a placeholder value in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)