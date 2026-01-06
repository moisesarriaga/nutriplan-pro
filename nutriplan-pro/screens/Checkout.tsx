import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard, QrCode, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createSubscription, getPaymentMethods } from '../../utils/subscriptionHelpers';
import { loadMercadoPago } from "@mercadopago/sdk-js";

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { plan } = useParams<{ plan: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mpInitialized, setMpInitialized] = useState(false);

    const planDetails = {
        free: { name: 'Grátis', price: 0, description: 'Para quem está começando a se organizar.' },
        simple: { name: 'Simples', price: 39.90, description: 'O essencial para ter controle total.' },
        premium: { name: 'Premium', price: 59.90, description: 'Para famílias que buscam praticidade máxima.' }
    };

    const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.simple;

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const initMP = async () => {
            try {
                await loadMercadoPago();
                const publicKey = (import.meta as any).env.VITE_MERCADOPAGO_PUBLIC_KEY;
                if (publicKey) {
                    new (window as any).MercadoPago(publicKey);
                    setMpInitialized(true);
                    console.log('Mercado Pago SDK initialized');
                }

                // Optional: verify payment methods API
                const methods = await getPaymentMethods();
                console.log('Available payment methods:', methods);
            } catch (err) {
                console.error('Error initializing Mercado Pago:', err);
            }
        };

        initMP();
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('Você precisa estar logado para continuar');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await createSubscription(
                plan as 'free' | 'simple' | 'premium'
            );

            if (!response.success) {
                throw new Error(response.error || 'Erro ao criar assinatura');
            }

            // If free plan, redirect directly to thank you
            if (plan === 'free' || response.redirect) {
                navigate('/thank-you');
            } else if (response.init_point) {
                // Redirect to Mercado Pago checkout
                window.location.href = response.init_point;
            } else {
                throw new Error('Erro ao processar pagamento');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-gray-200">
            {/* Header */}
            <div className="bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Finalizar Assinatura</h1>
                        <p className="text-sm text-gray-400">Plano {selectedPlan.name}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Payment Form */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Confirmar Assinatura</h2>
                            <p className="text-gray-400 text-sm">
                                {selectedPlan.price === 0
                                    ? 'Ative seu plano gratuito agora mesmo'
                                    : 'Você será redirecionado para o Mercado Pago para completar o pagamento'
                                }
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-500 font-semibold">Erro ao processar</p>
                                    <p className="text-red-400 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Plan Summary */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <h3 className="font-semibold text-white mb-4">Detalhes da Assinatura</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Plano</span>
                                        <span className="text-white font-semibold">{selectedPlan.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Valor Mensal</span>
                                        <span className="text-neon-green font-bold">
                                            R$ {selectedPlan.price.toFixed(2)}
                                        </span>
                                    </div>
                                    {selectedPlan.price > 0 && (
                                        <>
                                            <div className="border-t border-white/10 pt-3 mt-3">
                                                <p className="text-sm text-gray-400">
                                                    <Check className="w-4 h-4 inline text-neon-green mr-2" />
                                                    Cobrança automática mensal
                                                </p>
                                                <p className="text-sm text-gray-400 mt-2">
                                                    <Check className="w-4 h-4 inline text-neon-green mr-2" />
                                                    Cancele quando quiser
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Methods Info */}
                            {selectedPlan.price > 0 && (
                                <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-6">
                                    <h4 className="font-semibold text-white mb-3">Métodos de Pagamento Aceitos</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <CreditCard className="w-5 h-5 text-neon-green" />
                                            <span>Cartão de Crédito</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <QrCode className="w-5 h-5 text-neon-green" />
                                            <span>PIX</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Pagamento processado com segurança pelo Mercado Pago
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-neon-green text-black font-bold py-4 px-6 rounded-lg hover:shadow-glow-hover transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        <span>Processando...</span>
                                    </div>
                                ) : (
                                    selectedPlan.price === 0
                                        ? 'Ativar Plano Gratuito'
                                        : 'Ir para Pagamento'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
                            <h3 className="text-xl font-bold text-white mb-6">Resumo do Pedido</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-white">Plano {selectedPlan.name}</p>
                                        <p className="text-sm text-gray-400">{selectedPlan.description}</p>
                                    </div>
                                    <p className="font-bold text-white">R$ {selectedPlan.price.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 mb-6">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-white">Total Mensal</span>
                                    <span className="font-bold text-neon-green">R$ {selectedPlan.price.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-gray-400">
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                                    <span>Cancele quando quiser</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                                    <span>Pagamento seguro via Mercado Pago</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                                    <span>Acesso imediato após confirmação</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
