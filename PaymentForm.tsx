import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        MercadoPago: any;
    }
}

export const PaymentForm = () => {
    const mpRef = useRef<any>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.addEventListener('load', () => {
            mpRef.current = new window.MercadoPago('SUA_PUBLIC_KEY');
        });
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!mpRef.current) return;

        const formData = new FormData(e.currentTarget);
        const cardFormData = {
            cardNumber: formData.get('cardNumber') as string,
            cardExpirationMonth: formData.get('cardExpirationMonth') as string,
            cardExpirationYear: formData.get('cardExpirationYear') as string,
            securityCode: formData.get('securityCode') as string,
            cardholderName: formData.get('cardholderName') as string,
            cardholderEmail: formData.get('cardholderEmail') as string,
        };

        try {
            const cardToken = await mpRef.current.createCardToken({
                cardNumber: cardFormData.cardNumber,
                expirationMonth: cardFormData.cardExpirationMonth,
                expirationYear: cardFormData.cardExpirationYear,
                securityCode: cardFormData.securityCode,
                cardholderName: cardFormData.cardholderName,
                cardholderEmail: cardFormData.cardholderEmail,
            });

            await fetch('http://localhost:3000/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: cardToken.id,
                    email: cardFormData.cardholderEmail,
                }),
            });

            alert('Pagamento enviado!');
        } catch (error) {
            console.error(error);
            alert('Erro ao processar pagamento');
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <input name="cardNumber" placeholder="Número do cartão" required />
            <input name="cardExpirationMonth" placeholder="Mês (MM)" required />
            <input name="cardExpirationYear" placeholder="Ano (YY)" required />
            <input name="securityCode" placeholder="CVV" required />
            <input name="cardholderName" placeholder="Nome do titular" required />
            <input name="cardholderEmail" placeholder="E-mail" type="email" required />
            <select name="installments" id="installments"></select>
            <button type="submit">Pagar</button>
        </form>
    );
};