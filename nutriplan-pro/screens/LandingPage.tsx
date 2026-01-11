import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, ChefHat, UtensilsCrossed, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { MOCK_USER } from "../../constants";

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [profile, setProfile] = useState<{ nome: string; avatar_url: string } | null>(null);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('perfis_usuario')
                .select('nome, avatar_url')
                .eq('id', user?.id)
                .single();

            if (data) setProfile(data);
        } catch (err) {
            console.error('Error fetching landing profile:', err);
        }
    };



    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-gray-200 selection:bg-neon-green selection:text-black font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl tracking-tight">
                        <span>MENU</span>
                        <span className="text-neon-green">LIST</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="relative">
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                                        style={{ backgroundImage: `url(${profile?.avatar_url || MOCK_USER.avatar})` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-neon-green transition-colors">
                                    {profile?.nome ? profile.nome.split(' ')[0] : 'Usuário'}
                                </span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-sm font-medium hover:text-neon-green transition-colors"
                                >
                                    Cadastrar
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-sm font-medium hover:text-neon-green transition-colors">
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-green/20 rounded-full blur-[100px] -z-10" />

                <div className="max-w-[1000px] mx-auto text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                        Economize <span className="text-neon-green">tempo</span> e <span className="text-neon-green">dinheiro</span> nas suas compras!
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">
                        A maneira mais inteligente de organizar suas refeições. Planeje, economize e tenha controle total do seu carrinho.
                    </p>

                    <div className="pt-12">
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-neon-green text-black font-bold py-4 px-12 rounded-xl text-lg hover:shadow-glow-hover transition-all transform hover:-translate-y-1"
                        >
                            Começar Agora Gratuitamente
                        </button>
                    </div>

                    <div className="pt-20 animate-fade-in">
                        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Por que usar a <span className="text-neon-green">MENU LIST</span>?
                        </h2>
                        <p className="text-slate-500 dark:text-gray-400 text-base max-w-xl mx-auto">
                            Ferramentas poderosas para transformar sua relação com o supermercado e a cozinha.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Title (already in Hero) */}

            {/* Features Grid */}
            <section className="py-20 px-6">
                <div className="max-w-[1000px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<ChefHat className="w-6 h-6" />}
                            title="Acesso a várias receitas"
                            description="Milhares de receitas deliciosas integradas diretamente à sua lista de compras."
                        />
                        <FeatureCard
                            icon={<UtensilsCrossed className="w-6 h-6" />}
                            title="Controle do que você come"
                            description="Monitore macros e nutrientes automaticamente com base nas suas compras."
                        />
                        <FeatureCard
                            icon={<ShoppingCart className="w-6 h-6" />}
                            title="Porquê você está comprando"
                            description="Insights inteligentes sobre seus hábitos de consumo e onde economizar."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-6 h-6" />}
                            title="Melhor que IA"
                            description="Uma lista personalizada que entende seu gosto melhor que qualquer algoritmo genérico."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-6">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Escolha o plano ideal</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-lg">
                            Comece grátis e evolua conforme suas necessidades.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                        {/* Free */}
                        <PricingCard
                            title="Grátis"
                            price="R$ 0"
                            period="/mês"
                            description="Para quem está começando a se organizar."
                            features={[
                                "Acesso básico ao app",
                                "1 Lista de compras",
                                "Sem anúncios intrusivos"
                            ]}
                            buttonText="Escolher Plano"
                            plan="free"
                        />
                        <PricingCard
                            title="Simples"
                            price="R$ 39,90"
                            period="/mês"
                            description="O essencial para ter controle total."
                            highlighted
                            features={[
                                "Tudo do plano Grátis",
                                "Até 2 aparelhos conectados",
                                "Controle de Calorias",
                                "Soma automática de preços",
                                "Receitas exclusivas"
                            ]}
                            buttonText="Escolher Plano"
                            plan="simple"
                        />
                        <PricingCard
                            title="Premium"
                            price="R$ 59,90"
                            period="/mês"
                            description="Para famílias que buscam praticidade máxima."
                            features={[
                                "Tudo do plano Simples",
                                "Até 6 aparelhos (Plano Familiar)",
                                "Prioridade no suporte",
                                "Acesso antecipado a novas features",
                                "Análise de consumo avançada"
                            ]}
                            buttonText="Escolher Plano"
                            plan="premium"
                        />
                    </div>
                </div>
            </section >

            {/* FAQ Section */}
            < section className="py-20 px-6" >
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        <FAQItem question="O que é a MENU LIST?" answer="A MENU LIST é um aplicativo que ajuda você a planejar suas refeições e gerar listas de compras inteligentes para economizar tempo e dinheiro." />
                        <FAQItem question="Como faço para cancelar?" answer="Você pode cancelar sua assinatura a qualquer momento através das configurações do aplicativo, sem multas ou taxas." />
                        <FAQItem question="Quanto custa?" answer="Temos um plano gratuito. O plano Simples custa R$ 39,90/mês e o Premium R$ 59,90/mês para toda a família." />
                        <FAQItem question="Quais tipos de listas consigo montar?" answer="Você pode montar listas baseadas em receitas, listas avulsas, e listas compartilhadas com a família." />
                    </div>
                </div>
            </section >

            {/* Footer */}
            < footer className="py-12 bg-background-light dark:bg-background-dark border-t border-black/5 dark:border-white/10 text-center" >
                <div className="max-w-[400px] mx-auto mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Aparência do Sistema</p>
                    <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center relative h-12">
                        {[
                            { id: 'light', label: 'Claro' },
                            { id: 'dark', label: 'Escuro' },
                            { id: 'auto', label: 'Auto' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setTheme(opt.id as any)}
                                className={`flex-1 flex items-center justify-center h-10 rounded-xl text-sm font-bold transition-all relative z-10 ${theme === opt.id
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <div
                            className="absolute h-10 bg-primary rounded-xl transition-all duration-300 shadow-sm"
                            style={{
                                width: 'calc((100% - 8px) / 3)',
                                left: theme === 'light' ? '4px' : theme === 'dark' ? 'calc(4px + (100% - 8px) / 3)' : 'calc(4px + 2 * (100% - 8px) / 3)'
                            }}
                        />
                    </div>
                </div>
                <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} MENU LIST. Todos os direitos reservados.</p>
            </footer >
        </div >
    );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-black/5 dark:border-white/5 hover:border-neon-green/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-transparent border-2 border-neon-green rounded-lg flex items-center justify-center text-neon-green mb-4 group-hover:bg-neon-green group-hover:text-black transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function PricingCard({
    title,
    price,
    period = "",
    description,
    features,
    highlighted = false,
    buttonText = "Escolher Plano",
    plan
}: {
    title: string,
    price: string,
    period?: string,
    description: string,
    features: string[],
    highlighted?: boolean,
    buttonText?: string,
    plan: string
}) {
    const navigate = useNavigate();
    return (
        <div className={`rounded-2xl p-8 relative flex flex-col ${highlighted
            ? 'bg-white dark:bg-surface-dark border-2 border-neon-green shadow-glow transform md:-translate-y-4'
            : 'bg-white/50 dark:bg-card-bg/50 border border-black/5 dark:border-white/10'}`}>
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-green text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    MAIS POPULAR
                </div>
            )}
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <div className="flex items-end gap-1 mb-3">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">{price}</span>
                {period && <span className="text-slate-500 dark:text-gray-400 text-base mb-2">{period}</span>}
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">{description}</p>

            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-300 mb-8 flex-grow">
                {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => navigate(`/checkout/${plan}`)}
                className={`w-full py-3.5 rounded-xl font-bold transition-all ${highlighted ? 'bg-neon-green text-black hover:shadow-glow-hover hover:scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
                {buttonText}
            </button>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10">
            <button
                className="w-full py-4 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-medium text-slate-900 dark:text-white">{question}</span>
                {isOpen ? <ChevronUp className="text-neon-green" /> : <ChevronDown className="text-slate-400 dark:text-gray-500" />}
            </button>
            {isOpen && (
                <div className="pb-4 text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default LandingPage;
