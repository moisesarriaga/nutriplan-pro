import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({
                success: false,
                error: `Supabase configuration missing on server. URL: ${!!SUPABASE_URL}, KEY: ${!!SUPABASE_SERVICE_ROLE_KEY}`
            });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Call the database function to check and expire subscriptions
        const { data, error } = await supabase.rpc('check_expired_subscriptions');

        if (error) {
            throw error;
        }

        console.log(`Checked subscriptions. Expired count: ${data}`);

        return res.status(200).json({
            success: true,
            expired_count: data,
            message: `Successfully checked subscriptions. ${data} subscription(s) expired.`,
        });
    } catch (error: any) {
        console.error('Error checking subscriptions:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
}
