import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const ThankYou: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-gray-200 flex items-center justify-center px-6">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Success Icon */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-neon-green/20 rounded-full blur-3xl"></div>
                    <CheckCircle className="w-24 h-24 text-neon-green mx-auto relative" strokeWidth={1.5} />
                </div>

                {/* Main Message */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                        Pagamento Confirmado!
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-gray-400">
                        Bem-vindo à <span className="text-neon-green font-semibold">MENU LIST</span>
                    </p>
                </div>

                {/* Success Details */}
                <div className="bg-white dark:bg-surface-dark border border-black/5 dark:border-white/10 rounded-2xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-start gap-4 text-left">
                        <Sparkles className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Sua assinatura está ativa!</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                Você já pode começar a usar todos os recursos do seu plano. Organize suas refeições,
                                crie listas de compras inteligentes e economize tempo e dinheiro.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-black/5 dark:border-white/10 pt-6">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Próximos Passos:</h4>
                        <div className="space-y-3 text-sm text-slate-500 dark:text-gray-400 text-left">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-neon-green font-bold text-xs">1</span>
                                </div>
                                <p>Complete seu perfil e configure suas preferências alimentares</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-neon-green font-bold text-xs">2</span>
                                </div>
                                <p>Explore receitas e adicione suas favoritas</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-neon-green font-bold text-xs">3</span>
                                </div>
                                <p>Monte seu cardápio semanal e gere sua primeira lista de compras</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-neon-green text-black font-bold py-4 px-8 rounded-lg hover:shadow-glow-hover transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <span>Acessar Dashboard</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-white/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold py-4 px-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/20 transition-all"
                    >
                        Configurar Perfil
                    </button>
                </div>

                {/* Support Message */}
                <div className="pt-8 border-t border-black/5 dark:border-white/10">
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                        Enviamos um e-mail de confirmação com todos os detalhes da sua assinatura.
                        <br />
                        Precisa de ajuda? Entre em contato com nosso suporte.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ThankYou;
