import express from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Permite requisições do frontend (Vite)

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

app.post("/pay", async (req, res) => {
    try {
        const result = await payment.create({
            body: {
                transaction_amount: 100,
                token: req.body.token,
                description: "Pedido #123",
                installments: 1,
                payment_method_id: "visa",
                payer: {
                    email: req.body.email,
                },
                capture: true,
                binary_mode: false,
                three_d_secure_mode: "optional",
            },
        });

        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));