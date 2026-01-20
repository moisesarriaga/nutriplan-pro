import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

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

        // Initialize Supabase variables inside handler
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uuhebbtjphitogxcxlix.supabase.co';
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY;

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

    // 1. Fetch detailed payment data from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    });

    if (!response.ok) {
        console.error(`Error fetching payment ${paymentId} from Mercado Pago.`);
        return;
    }
    const paymentData = await response.json();

    // Check if it's a recurring payment from a subscription
    if (paymentData.preapproval_id) {
        if (paymentData.status === 'approved') {
            console.log(`Recurring payment ${paymentId} approved for preapproval ${paymentData.preapproval_id}.`);

            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('mercadopago_preapproval_id', paymentData.preapproval_id)
                .single();

            if (error || !subscription) {
                console.error(`Subscription with preapproval_id ${paymentData.preapproval_id} not found for recurring payment.`);
                return;
            }

            const nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

            await supabase
                .from('subscriptions')
                .update({
                    status: 'active', // Ensure it's active
                    last_payment_date: new Date().toISOString(),
                    next_payment_date: nextPaymentDate.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id);
            
            console.log(`Subscription ${subscription.id} updated with new payment date.`);
        } else {
            console.warn(`Recurring payment ${paymentId} for preapproval ${paymentData.preapproval_id} was not approved (status: ${paymentData.status}).`);
            // Optionally, handle failed recurring payments (e.g., set subscription status to 'paused' or 'overdue')
        }
        return; // End execution for recurring payments
    }


    // This part handles one-time payments (which we are not using for subscriptions now)
    // or the very first payment if it's not handled by handleSubscriptionEvent.
    // Kept for legacy or other payment types.
    const { data: validation, error: validationError } = await supabase
        .from('payment_validations')
        .select('*')
        .eq('payment_id', paymentId.toString())
        .single();

    if (validationError || !validation) {
        console.log(`Payment validation record not found for one-time payment_id: ${paymentId}. This is expected for recurring payments.`);
        return;
    }

    if (paymentData.status === 'approved') {
        // This logic is now primarily handled by handleSubscriptionEvent, but we keep it as a fallback.
        console.log(`One-time payment ${paymentId} approved. Updating subscription for user ${validation.user_id}.`);

        await supabase
            .from('payment_validations')
            .update({ status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', validation.id);

        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const subscriptionData = {
            plan_type: validation.plan_type,
            status: 'active',
            mercadopago_preapproval_id: paymentData.preapproval_id || paymentId.toString(), // Use preapproval_id if available
            last_payment_date: new Date().toISOString(),
            next_payment_date: nextPaymentDate.toISOString(),
        };

        await supabase
            .from('subscriptions')
            .upsert({ user_id: validation.user_id, ...subscriptionData }, { onConflict: 'user_id' });

        console.log(`Subscription for user ${validation.user_id} created/updated via one-time payment flow.`);
        
    } else {
        console.log(`One-time payment ${paymentId} not approved (status: ${paymentData.status}). Updating validation record.`);
        await supabase
            .from('payment_validations')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', validation.id);
    }
}

async function handleSubscriptionEvent(supabase: any, webhookData: any) {
    const preapprovalId = webhookData.data.id;

    // 1. Fetch preapproval data from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    });

    if (!response.ok) {
        console.error(`Error fetching preapproval ${preapprovalId} from Mercado Pago.`);
        return;
    }
    const subData = await response.json();

    // 2. Find the corresponding entry in payment_validations
    const { data: validation, error: validationError } = await supabase
        .from('payment_validations')
        .select('*')
        .eq('payment_id', preapprovalId.toString()) // preapproval_id was stored in payment_id
        .single();

    if (validationError || !validation) {
        console.warn(`Payment validation record not found for preapproval_id: ${preapprovalId}. It might have been a recurring payment handled by handlePaymentEvent.`);
        
        // As a fallback, check if a subscription already exists and just update its status
        const { data: subscription } = await supabase.from('subscriptions').select('*').eq('mercadopago_preapproval_id', preapprovalId).single();
        if(subscription) {
            let newStatus = subscription.status;
            if (subData.status === 'authorized') newStatus = 'active';
            if (subData.status === 'cancelled' || subData.status === 'paused') newStatus = 'cancelled';

            await supabase.from('subscriptions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', subscription.id);
            console.log(`Subscription ${subscription.id} status updated to ${newStatus} based on preapproval status.`);
        }
        return;
    }

    if (subData.status === 'authorized') {
        // 3. Preapproval is authorized, create the subscription
        console.log(`Preapproval ${preapprovalId} authorized. Creating subscription for user ${validation.user_id}.`);

        // Update validation status to 'confirmed'
        await supabase
            .from('payment_validations')
            .update({ status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', validation.id);

        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const subscriptionData = {
            plan_type: validation.plan_type,
            status: 'active',
            mercadopago_preapproval_id: preapprovalId,
            last_payment_date: new Date().toISOString(),
            next_payment_date: nextPaymentDate.toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Upsert subscription (create if not exists, update if it does)
        await supabase
            .from('subscriptions')
            .upsert({ user_id: validation.user_id, ...subscriptionData }, { onConflict: 'user_id' });
        
        console.log(`Subscription for user ${validation.user_id} created/updated with plan ${validation.plan_type}.`);

    } else {
        // 4. Preapproval was not authorized, update validation status
        console.log(`Preapproval ${preapprovalId} not authorized (status: ${subData.status}). Updating validation record.`);
        await supabase
            .from('payment_validations')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', validation.id);
    }
}
