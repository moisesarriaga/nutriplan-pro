import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'x-signature, x-request-id, content-type',
            },
        })
    }

    try {
        const signature = req.headers.get('x-signature')
        const bodyText = await req.text()
        const data = JSON.parse(bodyText)

        // Webhook Signature Validation
        if (signature && WEBHOOK_SECRET) {
            const parts = signature.split(',')
            let ts = ''
            let v1 = ''
            parts.forEach(part => {
                const [key, value] = part.split('=')
                if (key === 'ts') ts = value
                if (key === 'v1') v1 = value
            })

            const manifest = `id:${data.id};topic:${data.type};ts:${ts};`

            // In Deno, we use Web Crypto API for HMAC
            const encoder = new TextEncoder()
            const keyData = encoder.encode(WEBHOOK_SECRET)
            const manifestData = encoder.encode(manifest)

            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            )

            // Convert hex v1 to Uint8Array
            const v1Array = new Uint8Array(v1.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

            const isValid = await crypto.subtle.verify(
                'HMAC',
                cryptoKey,
                v1Array,
                manifestData
            )

            if (!isValid) {
                console.error('Invalid Webhook Signature')
                return new Response('Invalid signature', { status: 401 })
            }
        }

        console.log('Webhook validated and received:', {
            type: data.type,
            action: data.action,
            id: data.data?.id || data.id,
        })

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Handle different webhook events
        if (data.type === 'payment') {
            await handlePaymentEvent(supabase, data)
        } else if (data.type === 'subscription_preapproval' || data.type === 'preapproval') {
            await handleSubscriptionEvent(supabase, data)
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: (error as Error).message,
            }),
            {
                status: 200, // Returning 200 to Mercado Pago even on process error to stop retries if it's a known non-retryable issue, but usually 400 is fine
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})

async function handlePaymentEvent(supabase: any, webhookData: any) {
    const paymentId = webhookData.data.id

    // Fetch detailed payment data from Mercado Pago
    const MP_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    })

    if (!response.ok) return
    const paymentData = await response.json()

    if (paymentData.status === 'approved') {
        // Find subscription by preapproval_id if it exists
        const preapprovalId = paymentData.metadata?.preapproval_id || paymentData.preapproval_id

        if (!preapprovalId) return

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('mercadopago_preapproval_id', preapprovalId)
            .single()

        if (subscription) {
            const nextPaymentDate = new Date()
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1) // Monthly

            // Update Subscription
            await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    last_payment_date: new Date().toISOString(),
                    next_payment_date: nextPaymentDate.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', subscription.id)

            // Update Profile plan_status (AS REQUESTED)
            await supabase
                .from('perfis_usuario')
                .update({ plan_status: 'active' })
                .eq('id', subscription.user_id)

            console.log(`User ${subscription.user_id} plan activated via payment`)
        }
    }
}

async function handleSubscriptionEvent(supabase: any, webhookData: any) {
    const preapprovalId = webhookData.data.id
    const MP_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    })

    if (!response.ok) return
    const subData = await response.json()

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('mercadopago_preapproval_id', preapprovalId)
        .single()

    if (subscription) {
        let newStatus = subscription.status
        if (subData.status === 'authorized') {
            newStatus = 'active'
        } else if (subData.status === 'cancelled' || subData.status === 'paused') {
            newStatus = 'cancelled'
        }

        await supabase
            .from('subscriptions')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(newStatus === 'cancelled' && { cancelled_at: new Date().toISOString() }),
            })
            .eq('id', subscription.id)

        // Sync with Profile
        await supabase
            .from('perfis_usuario')
            .update({ plan_status: newStatus === 'active' ? 'active' : 'inactive' })
            .eq('id', subscription.user_id)

        console.log(`Subscription ${subscription.id} sync state: ${newStatus}`)
    }
}

