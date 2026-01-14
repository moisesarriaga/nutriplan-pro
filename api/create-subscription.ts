import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();


// Configure Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});
const payment = new Payment(client);

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uuhebbtjphitogxcxlix.supabase.co';
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({ error: 'Supabase configuration missing' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Verify token if present
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                return res.status(401).json({ error: 'Unauthorized access to resource.' });
            }
        } else {
            return res.status(401).json({ error: 'Authorization header required' });
        }

        const { plan, userId, card_token_id, payer_email, payment_method_id, issuer_id } = req.body;

        if (!plan || !userId) {
            return res.status(400).json({ error: 'Plan and userId are required' });
        }

        if (!PLANS[plan as keyof typeof PLANS]) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];

        // Initialize environment variables inside handler
        const APP_URL = process.env.APP_URL || 'https://nutriplan-pro-six.vercel.app/';

        // Check if user already has a subscription
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

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
                    .eq('user_id', userId);
            } else {
                await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'free',
                        status: 'active',
                        next_payment_date: null,
                    });
            }

            return res.status(200).json({
                success: true,
                message: 'Free plan activated',
                redirect: `${APP_URL}/#/thank-you`,
            });
        }

        // For paid plans, create Mercado Pago payment (Transparent Checkout)
        if (!card_token_id || !payer_email || !payment_method_id || !issuer_id) {
            return res.status(400).json({ error: 'Missing required payment data (token, email, payment_method_id, issuer_id)' });
        }

        const paymentBody: any = {
            transaction_amount: selectedPlan.price,
            token: card_token_id,
            description: `Assinatura ${selectedPlan.name}`,
            installments: 1,
            payment_method_id,
            issuer_id,
            payer: {
                email: payer_email,
            },
            three_d_secure_mode: 'optional',
            capture: true,
            binary_mode: false,
            external_reference: userId,
            metadata: {
                user_id: userId,
                plan_type: plan
            }
        };

        const mpData = await payment.create({ body: paymentBody });

        // Store subscription in database
        const subscriptionData = {
            user_id: userId,
            plan_type: plan,
            status: mpData.status === 'approved' ? 'active' : 'pending',
            // We store payment ID as preapproval_id for reference
            mercadopago_preapproval_id: mpData.id?.toString(),
            next_payment_date: null, // Will be set after first payment
        };

        if (existingSubscription) {
            await supabase
                .from('subscriptions')
                .update(subscriptionData)
                .eq('user_id', userId);
        } else {
            await supabase
                .from('subscriptions')
                .insert(subscriptionData);
        }

        return res.status(200).json({
            success: true,
            id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
            // @ts-ignore
            three_ds_info: mpData.three_ds_info,
            redirect: mpData.status === 'approved' ? `${APP_URL}/#/thank-you` : undefined,
        });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
}
