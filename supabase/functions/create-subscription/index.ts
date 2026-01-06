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

        // Client 1: Validate JWT with Anon Key
        const supabaseAuth = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: {
                    headers: {
                        authorization: authHeader!,
                    },
                },
            }
        );

        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError) console.error("Auth Error:", userError);
        if (user) console.log("User verified:", user.id);

        if (userError || !user) {
            console.error("AUTH FAILED DETAILS:", JSON.stringify(userError));
            // Try to parse the JWT manually to see if it's even valid format
            const tokenParts = authHeader?.replace("Bearer ", "").split(".");
            console.log("Token parts count:", tokenParts?.length);

            return new Response(JSON.stringify({
                success: false,
                error: 'Authentication Failed',
                details: userError?.message || 'No user found from getUser()',
                debug_header: !!authHeader,
                debug_token_len: authHeader?.length
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log("Authenticated user:", user.id);

        // Client 2: Service Role for Admin operations (DB/Mercado Pago)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Alias for compatibility with rest of code using supabaseClient
        const supabaseClient = supabaseAdmin;

        const { plan, userId } = await req.json();

        if (!plan || !userId) {
            return new Response(JSON.stringify({ error: 'Plan and userId are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

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

        const mpData = await preApproval.create({ body: preapprovalBody });

        // Store subscription in database
        const subscriptionData = {
            user_id: userId,
            plan_type: plan,
            status: 'pending',
            mercadopago_preapproval_id: mpData.id,
            next_payment_date: null,
        };

        if (existingSubscription) {
            await supabaseClient
                .from('subscriptions')
                .update(subscriptionData)
                .eq('user_id', userId);
        } else {
            await supabaseClient
                .from('subscriptions')
                .insert(subscriptionData);
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
