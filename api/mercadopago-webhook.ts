import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const signature = req.headers['x-signature'] as string;
        const data = req.body;

        // Webhook Signature Validation
        if (signature && WEBHOOK_SECRET) {
            const parts = signature.split(',');
            let ts = '';
            let v1 = '';
            parts.forEach(part => {
                const [key, value] = part.split('=');
                if (key === 'ts') ts = value;
                if (key === 'v1') v1 = value;
            });

            const manifest = `id:${data.id};topic:${data.type};ts:${ts};`;
            const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
            hmac.update(manifest);
            const checkV1 = hmac.digest('hex');

            if (checkV1 !== v1) {
                console.error('Invalid Webhook Signature');
                return res.status(401).send('Invalid signature');
            }
        }

        console.log('Webhook validated and received:', {
            type: data.type,
            action: data.action,
            id: data.data?.id || data.id,
        });

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(200).json({
                success: false,
                error: `Supabase configuration missing on server. URL: ${!!SUPABASE_URL}, KEY: ${!!SUPABASE_SERVICE_ROLE_KEY}`
            });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Handle different webhook events
        if (data.type === 'payment') {
            await handlePaymentEvent(supabase, data);
        } else if (data.type === 'subscription_preapproval' || data.type === 'preapproval') {
            await handleSubscriptionEvent(supabase, data);
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return res.status(200).json({ // Return 200 to stop MP retries on non-recoverable errors
            success: false,
            error: error.message,
        });
    }
}

async function handlePaymentEvent(supabase: any, webhookData: any) {
    const paymentId = webhookData.data.id;

    // Fetch detailed payment data from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    });

    if (!response.ok) return;
    const paymentData = await response.json();

    if (paymentData.status === 'approved') {
        const preapprovalId = paymentData.metadata?.preapproval_id || paymentData.preapproval_id;

        if (!preapprovalId) return;

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('mercadopago_preapproval_id', preapprovalId)
            .single();

        if (subscription) {
            const nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

            await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    last_payment_date: new Date().toISOString(),
                    next_payment_date: nextPaymentDate.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', subscription.id);

            await supabase
                .from('perfis_usuario')
                .update({ plan_status: 'active' })
                .eq('id', subscription.user_id);

            console.log(`User ${subscription.user_id} plan activated via payment`);
        }
    }
}

async function handleSubscriptionEvent(supabase: any, webhookData: any) {
    const preapprovalId = webhookData.data.id;

    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    });

    if (!response.ok) return;
    const subData = await response.json();

    const { data: subscription } = await supabase
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

        await supabase
            .from('subscriptions')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(newStatus === 'cancelled' && { cancelled_at: new Date().toISOString() }),
            })
            .eq('id', subscription.id);

        await supabase
            .from('perfis_usuario')
            .update({ plan_status: newStatus === 'active' ? 'active' : 'inactive' })
            .eq('id', subscription.user_id);

        console.log(`Subscription ${subscription.id} sync state: ${newStatus}`);
    }
}
