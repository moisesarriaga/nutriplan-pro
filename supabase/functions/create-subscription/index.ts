// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MercadoPagoConfig, PreApproval } from 'npm:mercadopago';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
};

Deno.serve(async (req) => {
    console.log("Function create-subscription called");

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }


    try {
        const authHeader = req.headers.get('Authorization');
        console.log("Auth Header present:", !!authHeader);

        if (!authHeader) {
            console.error("Missing Authorization header");
            return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Alias for compatibility with rest of code using supabaseClient
        const supabaseClient = supabaseAdmin;

        // Verify User Token using Admin Client
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        console.log("getUser result:", { user: user ? { id: user.id, email: user.email } : null, error: userError });

        if (userError || !user) {
            console.error("Auth Fail - Error:", userError, "User:", user);
            return new Response(JSON.stringify({
                success: false,
                error: 'Authentication Failed',
                details: userError?.message || 'Invalid JWT'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PARANOID CHECK: Ensure user is absolutely not null here
        if (!user) {
            throw new Error("User became null unexpectedly after check");
        }

        console.log("User verified:", user.id);

        const { plan, userId } = await req.json();

        if (!plan || !userId) {
            return new Response(JSON.stringify({ error: 'Plan and userId are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Enforce ID match for security
        if (user.id !== userId) {
            return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];
        if (!selectedPlan) {
            return new Response(JSON.stringify({ error: 'Invalid plan' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Initialize Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || '',
        });
        const preApproval = new PreApproval(client);

        // If free plan, just update subscription in DB
        const { data: existingSubscription } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        const APP_URL = Deno.env.get('APP_URL') || 'https://nutriplan-pro-six.vercel.app/';

        if (plan === 'free') {
            if (existingSubscription) {
                await supabaseClient
                    .from('subscriptions')
                    .update({
                        plan_type: 'free',
                        status: 'active',
                        next_payment_date: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId);
            } else {
                await supabaseClient
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'free',
                        status: 'active',
                        next_payment_date: null,
                        updated_at: new Date().toISOString(),
                    });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Free plan activated',
                redirect: `${APP_URL}/#/thank-you`,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // For paid plans, create Mercado Pago subscription
        const preapprovalBody = {
            reason: `Assinatura ${selectedPlan.name} - MENU LIST`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: selectedPlan.price,
                currency_id: 'BRL',
            },
            back_url: `${APP_URL}/#/thank-you`,
            payer_email: user.email,
            status: 'pending',
        };

        console.log("Creating PreApproval with body:", JSON.stringify(preapprovalBody));
        const mpData = await preApproval.create({ body: preapprovalBody });
        console.log("Mercado Pago Response:", mpData);

        if (!mpData) {
            throw new Error("Mercado Pago returned null response");
        }
        if (!mpData.id) {
            console.error("Mercado Pago response missing ID:", mpData);
            throw new Error("Mercado Pago response missing ID");
        }

        // Insert into payment_validations table using schema from migration 003
        const { error: validationError } = await supabaseClient
            .from('payment_validations')
            .insert({
                user_id: userId,
                payment_id: mpData.id.toString(), // Storing preapproval_id as payment_id
                status_pagamento: 'pending',
                valor: selectedPlan.price,
                metodo_pagamento: 'mercadopago_preapproval',
                data_pagamento: null,
                payload_retorno: {
                    preapproval_id: mpData.id,
                    plan_type: plan,
                    init_point: mpData.init_point,
                    created_at: new Date().toISOString()
                }
            });

        if (validationError) {
            console.error('Error inserting into payment_validations:', validationError);
            throw new Error('Failed to save payment validation record.');
        }

        return new Response(JSON.stringify({
            success: true,
            init_point: mpData.init_point,
            preapproval_id: mpData.id,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
