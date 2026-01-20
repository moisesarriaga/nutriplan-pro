// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const data = await req.json();
        const MP_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || '';

        // Initialize Supabase admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('Webhook received:', JSON.stringify(data, null, 2));

        if (data.type === 'payment') {
            const paymentId = data.data.id;

            // Fetch payment details from Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
            });

            if (!response.ok) {
                console.error('Failed to fetch payment from Mercado Pago:', response.status);
                return new Response(JSON.stringify({ error: 'Failed to fetch payment' }), {
                    status: 200, // Return 200 to avoid retries
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const paymentData = await response.json();
            console.log('Payment data from MP:', JSON.stringify(paymentData, null, 2));

            // Find payment_validations record
            const { data: validation, error: validationError } = await supabaseAdmin
                .from('payment_validations')
                .select('*')
                .eq('payment_id', paymentId.toString())
                .single();

            if (validationError || !validation) {
                console.error('payment_validations record not found for payment_id:', paymentId);
                return new Response(JSON.stringify({ error: 'Validation record not found' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Extract plan_type from payload_retorno
            const planType = validation.payload_retorno?.plan_type;
            if (!planType) {
                console.error('plan_type not found in payload_retorno');
                return new Response(JSON.stringify({ error: 'Invalid validation record' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (paymentData.status === 'approved') {
                console.log(`Payment ${paymentId} approved. Creating subscription for user ${validation.user_id}`);

                // Update payment_validations to approved
                await supabaseAdmin
                    .from('payment_validations')
                    .update({
                        status_pagamento: 'approved',
                        data_pagamento: new Date().toISOString(),
                        valor: paymentData.transaction_amount,
                        metodo_pagamento: paymentData.payment_method_id || 'credit_card',
                        payload_retorno: {
                            ...validation.payload_retorno,
                            payment_approved_at: new Date().toISOString(),
                            mercadopago_response: paymentData
                        }
                    })
                    .eq('id', validation.id);

                const nextPaymentDate = new Date();
                nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

                // Create or update subscription record (ONLY on approved payment)
                const { error: subError } = await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: validation.user_id,
                        plan_type: planType,
                        status: 'active',
                        mercadopago_subscription_id: paymentId.toString(),
                        last_payment_date: new Date().toISOString(),
                        next_payment_date: nextPaymentDate.toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                if (subError) {
                    console.error('Error creating subscription:', subError);
                    throw subError;
                }

                console.log(`Subscription created for user ${validation.user_id} with plan ${planType}`);
            } else {
                console.log(`Payment ${paymentId} not approved (status: ${paymentData.status})`);

                // Update payment_validations to failed/rejected
                await supabaseAdmin
                    .from('payment_validations')
                    .update({
                        status_pagamento: paymentData.status, // 'rejected', 'cancelled', etc.
                        data_pagamento: new Date().toISOString(),
                        payload_retorno: {
                            ...validation.payload_retorno,
                            payment_failed_at: new Date().toISOString(),
                            mercadopago_response: paymentData
                        }
                    })
                    .eq('id', validation.id);
            }
        } else if (data.type === 'subscription_preapproval' || data.type === 'preapproval') {
            // Handle subscription preapproval events
            console.log('PreApproval webhook received, but not fully implemented yet');
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200, // Return 200 to avoid webhook retries
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
