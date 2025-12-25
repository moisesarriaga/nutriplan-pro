
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuhebbtjphitogxcxlix.supabase.co';
const supabaseAnonKey = 'sb_publishable_wEjqiGpgZNfxWXKg9p68nw_NrvegKNb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
