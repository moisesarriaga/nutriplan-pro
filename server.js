import express from "express";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
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
                        status: 'active', // Confirmado como ativo
                        mercadopago_preapproval_id: result.id,
                        updated_at: new Date()
                    }, { onConflict: 'user_id' });

                if (subError) console.error("Erro ao atualizar subscription:", subError);

                // 3. Atualizar o status do perfil para PRO
                const { error: profileError } = await supabase
                    .from('users') // Verifique se o nome da tabela é 'users' ou 'profiles'
                    .update({ isPro: true })
                    .eq('id', user.id);

                if (profileError) console.error("Erro ao atualizar perfil:", profileError);
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

app.listen(3000, () => console.log("Server running on port 3000"));