import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, ShoppingBasket, Info, List, Smartphone } from "lucide-react";
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
                    <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tighter">
                        <div className="p-1 bg-neon-green rounded-lg">
                            <ShoppingBasket className="w-5 h-5 text-black" />
                        </div>
                        <span>MENU LIST</span>
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

            {/* Reasons Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<ShoppingBasket />}
                            title="Várias Receitas"
                            description="Tenha acesso a várias receitas deliciosas e práticas."
                        />
                        <FeatureCard
                            icon={<Smartphone />}
                            title="Controle Total"
                            description="Tenha controle do que você está comendo e gastando."
                        />
                        <FeatureCard
                            icon={<Info />}
                            title="Consciência"
                            description="Saiba o porquê você está comprando cada item."
                        />
                        <FeatureCard
                            icon={<List />}
                            title="Lista Inteligente"
                            description="Lista melhor que nem IA consegue montar para você."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-6 bg-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">Escolha o plano ideal para você</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                        {/* Free */}
                        <PricingCard
                            title="Grátis"
                            price="R$ 0"
                            features={["Acesso básico", "1 lista de compras"]}
                        />
                        {/* Simple - Highlighted */}
                        <PricingCard
                            title="Plano Simples"
                            price="R$ 39,90"
                            period="/mês"
                            highlighted
                            features={["2 aparelhos", "Contagem de calorias", "Soma de preços", "Receitas ilimitadas"]}
                        />
                        {/* Premium */}
                        <PricingCard
                            title="Plano Premium"
                            price="R$ 59,90"
                            period="/mês"
                            features={["6 aparelhos", "Plano Familiar", "Todas as funções do Simples", "Suporte prioritário"]}
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
        <div className="bg-card-bg p-6 rounded-2xl border border-white/5 hover:border-neon-green/50 transition-colors group">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-neon-green mb-4 group-hover:bg-neon-green group-hover:text-black transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
        </div>
    );
}

function PricingCard({ title, price, period = "", features, highlighted = false }: { title: string, price: string, period?: string, features: string[], highlighted?: boolean }) {
    return (
        <div className={`rounded-2xl p-8 relative ${highlighted ? 'bg-card-bg border-2 border-neon-green shadow-glow transform md:-translate-y-4' : 'bg-card-bg/50 border border-white/10'}`}>
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-green text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais Popular
                </div>
            )}
            <h3 className="text-lg text-gray-400 mb-2">{title}</h3>
            <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{price}</span>
                {period && <span className="text-gray-500 text-sm mb-1">{period}</span>}
            </div>
            <ul className="space-y-4 text-sm text-gray-300 mb-8">
                {features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-neon-green" />
                        {feat}
                    </li>
                ))}
            </ul>
            <button className={`w-full py-3 rounded-lg font-bold transition-all ${highlighted ? 'bg-neon-green text-black hover:shadow-glow-hover' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                Assinar Agora
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
