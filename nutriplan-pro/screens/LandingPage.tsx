import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, ChefHat, UtensilsCrossed, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('leads')
                .insert([{ email, created_at: new Date().toISOString() }]);

            if (error) {
                throw error;
            }

            alert("Obrigado pelo interesse! Em breve entraremos em contato.");
            setEmail("");
        } catch (error) {
            console.error('Error adding lead:', error);
            alert("Erro ao salvar. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-gray-200 selection:bg-neon-green selection:text-black font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
                        <span>MENU</span>
                        <span className="text-neon-green">LIST</span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium hover:text-neon-green transition-colors"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-green/20 rounded-full blur-[100px] -z-10" />

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                        Economize <span className="text-neon-green">tempo</span> e <span className="text-neon-green">dinheiro</span> nas suas compras!
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        A maneira mais inteligente de organizar suas refeições. Planeje, economize e tenha controle total do seu carrinho.
                    </p>

                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mt-8">
                        <input
                            type="email"
                            placeholder="Quer montar sua lista agora? Informe seu e-mail"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-neon-green text-black font-bold py-3 px-6 rounded-lg hover:shadow-glow-hover transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Enviando..." : "Criar Assinatura"}
                        </button>
                    </form>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            Por que usar a <span className="text-neon-green">MENU LIST</span>?
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Ferramentas poderosas para transformar sua relação com o supermercado e a cozinha.
                        </p>
                    </div>
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
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Escolha o plano ideal</h2>
                        <p className="text-gray-400 text-lg">
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
                        />
                        {/* Simple - Highlighted */}
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
                        />
                        {/* Premium */}
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
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold text-center text-white">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        <FAQItem question="O que é a MENU LIST?" answer="A MENU LIST é um aplicativo que ajuda você a planejar suas refeições e gerar listas de compras inteligentes para economizar tempo e dinheiro." />
                        <FAQItem question="Como faço para cancelar?" answer="Você pode cancelar sua assinatura a qualquer momento através das configurações do aplicativo, sem multas ou taxas." />
                        <FAQItem question="Quanto custa?" answer="Temos um plano gratuito. O plano Simples custa R$ 39,90/mês e o Premium R$ 59,90/mês para toda a família." />
                        <FAQItem question="Quais tipos de listas consigo montar?" answer="Você pode montar listas baseadas em receitas, listas avulsas, e listas compartilhadas com a família." />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-black border-t border-white/10 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} MENU LIST. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-card-bg p-6 rounded-2xl border border-white/5 hover:border-neon-green/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-transparent border-2 border-neon-green rounded-lg flex items-center justify-center text-neon-green mb-4 group-hover:bg-neon-green group-hover:text-black transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
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
    buttonText = "Escolher Plano"
}: {
    title: string,
    price: string,
    period?: string,
    description: string,
    features: string[],
    highlighted?: boolean,
    buttonText?: string
}) {
    return (
        <div className={`rounded-2xl p-8 relative flex flex-col ${highlighted ? 'bg-card-bg border-2 border-neon-green shadow-glow transform md:-translate-y-4' : 'bg-card-bg/50 border border-white/10'}`}>
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-green text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    MAIS POPULAR
                </div>
            )}
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <div className="flex items-end gap-1 mb-3">
                <span className="text-5xl font-bold text-white">{price}</span>
                {period && <span className="text-gray-400 text-base mb-2">{period}</span>}
            </div>
            <p className="text-gray-400 text-sm mb-6">{description}</p>

            <ul className="space-y-3 text-sm text-gray-300 mb-8 flex-grow">
                {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            <button className={`w-full py-3.5 rounded-xl font-bold transition-all ${highlighted ? 'bg-neon-green text-black hover:shadow-glow-hover hover:scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
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
                <span className="font-medium text-white">{question}</span>
                {isOpen ? <ChevronUp className="text-neon-green" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {isOpen && (
                <div className="pb-4 text-gray-400 text-sm leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default LandingPage;
