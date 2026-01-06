
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uuhebbtjphitogxcxlix.supabase.co';
export const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGViYnRqcGhpdG9neGN4bGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjIxMDEsImV4cCI6MjA4MjA5ODEwMX0.w-myAcVCtxaIyRiPqTAXrBdokMDCsS1QCZUuFnQUlr4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
