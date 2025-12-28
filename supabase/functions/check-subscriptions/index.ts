import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Call the database function to check and expire subscriptions
        const { data, error } = await supabase.rpc('check_expired_subscriptions')

        if (error) {
            throw error
        }

        console.log(`Checked subscriptions. Expired count: ${data}`)

        return new Response(
            JSON.stringify({
                success: true,
                expired_count: data,
                message: `Successfully checked subscriptions. ${data} subscription(s) expired.`,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Error checking subscriptions:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    }
})
