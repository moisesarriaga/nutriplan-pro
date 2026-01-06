
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uuhebbtjphitogxcxlix.supabase.co';
export const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sDrDGEtCFmMKKYJDtPRCKQ_fLTd8Jbq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
