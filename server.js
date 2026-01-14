import express from "express";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Permite requisições do frontend (Vite)

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const preApproval = new PreApproval(client);

app.post("/subscribe", async (req, res) => {
    try {
        const result = await preApproval.create({
            body: {
                reason: "Assinatura Nutriplan Pro",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 100,
                    currency_id: "BRL"
                },
                payer_email: req.body.email,
                card_token_id: req.body.token,
                status: "authorized", // Solicita criação já autorizada
            },
        });

        // Validação: Só considera pago se o status for 'authorized'
        if (result.status === 'authorized') {
            // TODO: AQUI você deve chamar sua função de banco de dados para atualizar o usuário para PRO
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