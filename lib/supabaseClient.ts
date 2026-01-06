
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://uuhebbtjphitogxcxlix.supabase.co';
export const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wEjqiGpgZNfxWXKg9p68nw_NrvegKNb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
