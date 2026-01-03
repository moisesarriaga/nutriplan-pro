
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://uuhebbtjphitogxcxlix.supabase.co';
export const supabaseAnonKey = 'sb_publishable_wEjqiGpgZNfxWXKg9p68nw_NrvegKNb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
