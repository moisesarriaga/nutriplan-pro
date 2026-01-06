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

        console.log('Webhook received:', data);

        if (data.type === 'payment') {
            const paymentId = data.data.id;
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
            });

            if (response.ok) {
                const paymentData = await response.json();
                if (paymentData.status === 'approved') {
                    const preapprovalId = paymentData.metadata?.preapproval_id || paymentData.preapproval_id;
                    if (preapprovalId) {
                        const { data: subscription } = await supabaseAdmin
                            .from('subscriptions')
                            .select('*')
                            .eq('mercadopago_preapproval_id', preapprovalId)
                            .single();

                        if (subscription) {
                            const nextPaymentDate = new Date();
                            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

                            await supabaseAdmin
                                .from('subscriptions')
                                .update({
                                    status: 'active',
                                    last_payment_date: new Date().toISOString(),
                                    next_payment_date: nextPaymentDate.toISOString(),
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', subscription.id);

                            await supabaseAdmin
                                .from('perfis_usuario')
                                .update({ plan_status: 'active' })
                                .eq('id', subscription.user_id);
                        }
                    }
                }
            }
        } else if (data.type === 'subscription_preapproval' || data.type === 'preapproval') {
            const preapprovalId = data.data.id;
            const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
            });

            if (response.ok) {
                const subData = await response.json();
                const { data: subscription } = await supabaseAdmin
                    .from('subscriptions')
                    .select('*')
                    .eq('mercadopago_preapproval_id', preapprovalId)
                    .single();

                if (subscription) {
                    let newStatus = subscription.status;
                    if (subData.status === 'authorized') {
                        newStatus = 'active';
                    } else if (subData.status === 'cancelled' || subData.status === 'paused') {
                        newStatus = 'cancelled';
                    }

                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: newStatus,
                            updated_at: new Date().toISOString(),
                            ...(newStatus === 'cancelled' && { cancelled_at: new Date().toISOString() }),
                        })
                        .eq('id', subscription.id);

                    await supabaseAdmin
                        .from('perfis_usuario')
                        .update({ plan_status: newStatus === 'active' ? 'active' : 'inactive' })
                        .eq('id', subscription.user_id);
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
