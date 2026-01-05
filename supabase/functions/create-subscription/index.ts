import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://nutriplan-pro-six.vercel.app/'

const PLANS = {
    free: {
        name: 'Grátis',
        price: 0,
        description: 'Para quem está começando a se organizar',
    },
    simple: {
        name: 'Simples',
        price: 39.90,
        description: 'O essencial para ter controle total',
    },
    premium: {
        name: 'Premium',
        price: 59.90,
        description: 'Para famílias que buscam praticidade máxima',
    },
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const { plan, userId } = await req.json()

        if (!plan || !userId) {
            throw new Error('Plan and userId are required')
        }

        if (!PLANS[plan as keyof typeof PLANS]) {
            throw new Error('Invalid plan')
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS]

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Check if user already has a subscription
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()

        // If free plan, just create/update subscription
        if (plan === 'free') {
            if (existingSubscription) {
                await supabase
                    .from('subscriptions')
                    .update({
                        plan_type: 'free',
                        status: 'active',
                        next_payment_date: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
            } else {
                await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'free',
                        status: 'active',
                        next_payment_date: null,
                    })
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Free plan activated',
                    redirect: `${APP_URL}/#/thank-you`,
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            )
        }

        // For paid plans, create Mercado Pago subscription
        const preapprovalData = {
            reason: `Assinatura ${selectedPlan.name} - MENU LIST`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: selectedPlan.price,
                currency_id: 'BRL',
            },
            back_url: `${APP_URL}/#/thank-you`,
            payer_email: '', // Will be filled by Mercado Pago checkout
            status: 'pending',
        }

        // Create preapproval in Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(preapprovalData),
        })

        if (!mpResponse.ok) {
            const errorData = await mpResponse.json()
            console.error('Mercado Pago error details:', JSON.stringify(errorData))
            throw new Error(`Mercado Pago Error: ${errorData.message || 'Failed to create subscription'}`)
        }

        const mpData = await mpResponse.json()

        // Store subscription in database
        const subscriptionData = {
            user_id: userId,
            plan_type: plan,
            status: 'pending',
            mercadopago_preapproval_id: mpData.id,
            next_payment_date: null, // Will be set after first payment
        }

        if (existingSubscription) {
            await supabase
                .from('subscriptions')
                .update(subscriptionData)
                .eq('user_id', userId)
        } else {
            await supabase
                .from('subscriptions')
                .insert(subscriptionData)
        }

        return new Response(
            JSON.stringify({
                success: true,
                init_point: mpData.init_point,
                preapproval_id: mpData.id,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error) {
        console.error('Error creating subscription:', error)
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
