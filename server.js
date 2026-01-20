import express from "express";
import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(cors()); // Permite requisições do frontend (Vite)

// Configuração do Supabase (Certifique-se de ter essas variáveis no seu .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use a Service Role Key para operações seguras no backend
const supabase = createClient(supabaseUrl, supabaseKey);

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const preApproval = new PreApproval(client);

app.post("/subscribe", async (req, res) => {
    try {
        const { email, token } = req.body;

        const result = await preApproval.create({
            body: {
                reason: "Assinatura Nutriplan Pro",
                external_reference: email, // Vincula o email do usuário a este pagamento
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 100,
                    currency_id: "BRL"
                },
                payer_email: email,
                card_token_id: token,
                status: "authorized", // Solicita criação já autorizada
            },
        });

        // Validação: Só considera pago se o status for 'authorized'
        if (result.status === 'authorized') {
            // 1. Buscar o ID do usuário pelo email
            const { data: user, error: userError } = await supabase
                .from('users') // Verifique se o nome da tabela é 'users' ou 'profiles'
                .select('id')
                .eq('email', email)
                .single();

            if (user && !userError) {
                // 2. Atualizar ou criar a assinatura na tabela 'subscription'
                // Definimos o status como 'active' e o plano como 'simple' APENAS aqui
                const { error: subError } = await supabase
                    .from('subscription')
                    .upsert({
                        user_id: user.id,
                        plan_type: 'simple',
                        status: 'pending_payment', // Aguardando confirmação do pagamento
                        mercadopago_preapproval_id: result.id,
                        updated_at: new Date()
                    }, { onConflict: 'user_id' });

                if (subError) console.error("Erro ao atualizar subscription:", subError);
            }

            res.json({ status: 'approved', id: result.id });
        } else {
            res.status(400).json({ status: result.status, message: 'Assinatura não autorizada' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar assinatura' });
    }
});

// Rota de Webhook para confirmar o pagamento real
app.post("/webhook", async (req, res) => {
    const { type, data } = req.body;
    console.log(`🔔 Webhook recebido: ${type}`, data);

    if (type === "payment") {
        try {
            // Busca os detalhes do pagamento no Mercado Pago
            const payment = await new Payment(client).get({ id: data.id });

            // Se o pagamento foi aprovado
            console.log(`💳 Status do pagamento ${data.id}: ${payment.status}`);
            if (payment.status === 'approved') {
                const email = payment.external_reference;

                if (email) {
                    // AGORA SIM: Libera o acesso Pro para o usuário
                    const { error } = await supabase
                        .from('users')
                        .update({ isPro: true })
                        .eq('email', email);

                    if (error) console.error("Erro ao ativar Pro via webhook:", error);
                    else console.log(`Usuário ${email} ativado como PRO via webhook.`);
                }
            }
        } catch (error) {
            console.error("Erro no processamento do webhook:", error);
        }
    }
    res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));