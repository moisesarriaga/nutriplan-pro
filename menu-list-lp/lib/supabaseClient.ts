
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGViYnRqcGhpdG9neGN4bGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjIxMDEsImV4cCI6MjA4MjA5ODEwMX0.w-myAcVCtxaIyRiPqTAXrBdokMDCsS1QCZUuFnQUlr4'

let supabaseInstance: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
} else {
    console.warn('Supabase URL or Anon Key is missing. Supabase integration will be disabled.')
}

export const supabase = supabaseInstance
