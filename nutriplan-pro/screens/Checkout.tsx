import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard, QrCode, ArrowLeft, Check } from 'lucide-react';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { plan } = useParams<{ plan: string }>();
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
    const [loading, setLoading] = useState(false);

    const planDetails = {
        free: { name: 'Grátis', price: 0, description: 'Para quem está começando a se organizar.' },
        simple: { name: 'Simples', price: 39.90, description: 'O essencial para ter controle total.' },
        premium: { name: 'Premium', price: 59.90, description: 'Para famílias que buscam praticidade máxima.' }
    };

    const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.simple;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            navigate('/thank-you');
        }, 2000);
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
                            <h2 className="text-2xl font-bold text-white mb-2">Informações de Pagamento</h2>
                            <p className="text-gray-400 text-sm">Escolha a forma de pagamento e complete os dados</p>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-300">Método de Pagamento</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('credit_card')}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'credit_card'
                                            ? 'border-neon-green bg-neon-green/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="font-medium">Cartão</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'pix'
                                            ? 'border-neon-green bg-neon-green/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <QrCode className="w-5 h-5" />
                                    <span className="font-medium">PIX</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                        placeholder="João Silva"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                        placeholder="joao@exemplo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">CPF</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>

                            {/* Credit Card Fields */}
                            {paymentMethod === 'credit_card' && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Número do Cartão</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                            placeholder="0000 0000 0000 0000"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-2">Validade</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                                placeholder="MM/AA"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-300 mb-2">CVV</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PIX Instructions */}
                            {paymentMethod === 'pix' && (
                                <div className="pt-4 border-t border-white/10">
                                    <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-6 text-center space-y-4">
                                        <QrCode className="w-32 h-32 mx-auto text-neon-green" />
                                        <p className="text-sm text-gray-300">
                                            Após confirmar, você receberá o QR Code PIX para pagamento
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-neon-green text-black font-bold py-4 px-6 rounded-lg hover:shadow-glow-hover transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? 'Processando...' : `Confirmar Pagamento - R$ ${selectedPlan.price.toFixed(2)}/mês`}
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
