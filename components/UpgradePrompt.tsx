import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
    feature: string;
    requiredPlan: 'simple' | 'premium';
    onClose?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, requiredPlan, onClose }) => {
    const navigate = useNavigate();

    const planDetails = {
        simple: {
            name: 'Simples',
            price: 'R$ 39,90/mês',
            features: ['Controle de Calorias', 'Soma automática de preços', 'Receitas exclusivas'],
        },
        premium: {
            name: 'Premium',
            price: 'R$ 59,90/mês',
            features: ['Plano Familiar (6 aparelhos)', 'Prioridade no suporte', 'Análise avançada'],
        },
    };

    const plan = planDetails[requiredPlan];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-surface-dark border border-white/10 rounded-2xl max-w-md w-full p-8 relative">
                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-neon-green" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                    Recurso Premium
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    {feature} está disponível no plano <span className="text-neon-green font-semibold">{plan.name}</span>
                </p>

                {/* Plan details */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Plano {plan.name}</h3>
                        <span className="text-neon-green font-bold">{plan.price}</span>
                    </div>
                    <ul className="space-y-3">
                        {plan.features.map((feat, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                <Sparkles className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate(`/checkout/${requiredPlan}`)}
                        className="w-full bg-neon-green text-black font-bold py-3 px-6 rounded-lg hover:shadow-glow-hover transition-all flex items-center justify-center gap-2"
                    >
                        <span>Fazer Upgrade</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full bg-white/5 border border-white/10 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-all"
                        >
                            Voltar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt;
