import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This exports a live connection machine that we can import anywhere in our app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
