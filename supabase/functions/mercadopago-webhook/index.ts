import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

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
        const body = await req.text()
        const data = JSON.parse(body)

        // Validate webhook signature (Mercado Pago sends x-signature header)
        const signature = req.headers.get('x-signature')
        const requestId = req.headers.get('x-request-id')

        // Note: In production, implement proper signature validation
        // For now, we'll use a simple secret check
        console.log('Webhook received:', {
            type: data.type,
            action: data.action,
            data: data.data,
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
                error: error.message,
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})

async function handlePaymentEvent(supabase: any, data: any) {
    const { action, data: paymentData } = data

    if (action === 'payment.created' || action === 'payment.updated') {
        // Get payment details from Mercado Pago
        const paymentId = paymentData.id

        // Update subscription based on payment status
        if (paymentData.status === 'approved') {
            // Find subscription by preapproval_id
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('mercadopago_preapproval_id', paymentData.preapproval_id)
                .single()

            if (subscription) {
                // Calculate next payment date (30 days from now)
                const nextPaymentDate = new Date()
                nextPaymentDate.setDate(nextPaymentDate.getDate() + 30)

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        last_payment_date: new Date().toISOString(),
                        next_payment_date: nextPaymentDate.toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', subscription.id)

                console.log(`Subscription ${subscription.id} activated`)
            }
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            // Payment failed - keep subscription as pending or cancel
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('mercadopago_preapproval_id', paymentData.preapproval_id)
                .single()

            if (subscription) {
                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', subscription.id)

                console.log(`Subscription ${subscription.id} cancelled due to payment failure`)
            }
        }
    }
}

async function handleSubscriptionEvent(supabase: any, data: any) {
    const { action, data: subscriptionData } = data

    if (action === 'updated') {
        const preapprovalId = subscriptionData.id

        // Update subscription status based on Mercado Pago status
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('mercadopago_preapproval_id', preapprovalId)
            .single()

        if (subscription) {
            let newStatus = subscription.status

            if (subscriptionData.status === 'authorized') {
                newStatus = 'active'
            } else if (subscriptionData.status === 'cancelled' || subscriptionData.status === 'paused') {
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

            console.log(`Subscription ${subscription.id} updated to ${newStatus}`)
        }
    }
}
