import express from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from the frontend

// Supabase and Mercado Pago Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceRoleKey || !accessToken) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const mpClient = new MercadoPagoConfig({ accessToken });
const payment = new Payment(mpClient);

const PLANS = {
    simple: { price: 39.90, name: 'Simples' },
    premium: { price: 59.90, name: 'Premium' },
};

// This endpoint replaces 'api/create-subscription.ts' for local dev
app.post("/api/create-subscription", async (req, res) => {
    try {
        const { plan, userId, card_token_id, payer_email, payment_method_id, issuer_id, identification } = req.body;

        if (!plan || !userId || !card_token_id) {
            return res.status(400).json({ error: 'Missing required fields (plan, userId, card_token_id)' });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];
        if (!selectedPlan) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const paymentBody = {
            transaction_amount: selectedPlan.price,
            token: card_token_id,
            description: `Assinatura ${selectedPlan.name}`,
            installments: 1,
            payment_method_id,
            issuer_id,
            payer: { email: payer_email, identification },
            metadata: { user_id: userId, plan_type: plan },
            external_reference: userId, // For easier mapping
        };

        const mpData = await payment.create({ body: paymentBody });

        if (!mpData.id) {
            throw new Error("Payment creation failed in Mercado Pago");
        }

        // Insert into payment_validations table using schema from migration 003
        const { error: validationError } = await supabase
            .from('payment_validations')
            .insert({
                user_id: userId,
                payment_id: mpData.id.toString(),
                status_pagamento: 'pending',
                valor: selectedPlan.price,
                metodo_pagamento: payment_method_id || 'credit_card',
                data_pagamento: null,
                payload_retorno: {
                    payment_id: mpData.id,
                    plan_type: plan,
                    transaction_amount: selectedPlan.price,
                    created_at: new Date().toISOString()
                }
            });

        if (validationError) {
            console.error('Error inserting into payment_validations:', validationError);
            return res.status(500).json({ error: 'Failed to save payment validation', details: validationError.message });
        }

        console.log(`Payment validation record created for payment ID: ${mpData.id}`);
        res.status(200).json({ success: true, id: mpData.id, status: mpData.status });

    } catch (error: any) {
        console.error('Error in /api/create-subscription:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

// This endpoint replaces 'api/mercadopago-webhook.ts' for local dev
app.post("/api/mercadopago-webhook", async (req, res) => {
    const { type, data } = req.body;
    console.log(`🔔 Webhook received: ${type}`, data);

    if (type !== "payment") {
        return res.sendStatus(200); // Ignore other notification types
    }

    try {
        const paymentId = data.id;

        // 1. Fetch payment details from Mercado Pago
        const paymentDetails = await payment.get({ id: paymentId });

        // 2. Find the corresponding entry in payment_validations
        const { data: validation, error: validationError } = await supabase
            .from('payment_validations')
            .select('*')
            .eq('payment_id', paymentId.toString())
            .single();

        if (validationError || !validation) {
            console.error(`Payment validation record not found for payment_id: ${paymentId}`);
            return res.status(404).send('Validation record not found.');
        }

        // Extract plan_type from payload_retorno JSONB
        const planType = validation.payload_retorno?.plan_type;

        if (!planType) {
            console.error(`plan_type not found in payload_retorno for payment_id: ${paymentId}`);
            return res.status(400).send('Invalid payment validation record.');
        }

        if (paymentDetails.status === 'approved') {
            console.log(`Payment ${paymentId} approved. Creating subscription for user ${validation.user_id}.`);

            // Update validation record with approved status (using migration 003 schema)
            await supabase
                .from('payment_validations')
                .update({
                    status_pagamento: 'approved',
                    data_pagamento: new Date().toISOString(),
                    payload_retorno: {
                        ...validation.payload_retorno,
                        payment_approved_at: new Date().toISOString(),
                        mercadopago_status: paymentDetails.status
                    }
                })
                .eq('id', validation.id);

            const nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

            // 3. Create or update subscription ONLY after payment approval
            const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: validation.user_id,
                    plan_type: planType,
                    status: 'active',
                    mercadopago_subscription_id: paymentDetails.id?.toString(),
                    last_payment_date: new Date().toISOString(),
                    next_payment_date: nextPaymentDate.toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (subError) throw subError;
            console.log(`Subscription for user ${validation.user_id} is now active with plan ${planType}.`);

        } else {
            console.log(`Payment ${paymentId} not approved (status: ${paymentDetails.status}). Updating validation record.`);
            await supabase
                .from('payment_validations')
                .update({
                    status_pagamento: 'failed',
                    data_pagamento: new Date().toISOString(),
                    payload_retorno: {
                        ...validation.payload_retorno,
                        payment_failed_at: new Date().toISOString(),
                        mercadopago_status: paymentDetails.status
                    }
                })
                .eq('id', validation.id);
        }

        res.sendStatus(200);

    } catch (error: any) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: 'Webhook processing failed', details: error.message });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));