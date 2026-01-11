
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { ArrowLeft, Receipt, ShoppingCart } from 'lucide-react';

const SavedLists: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCurrentList();
        }
    }, [user]);

    const fetchCurrentList = async () => {
        try {
            const { data, error } = await supabase
                .from('lista_compras_consolidada')
                .select('*')
                .eq('usuario_id', user?.id);

            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error('Error fetching list:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center">Minhas Listas</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <Receipt className="text-slate-300" size={64} />
                        <p className="text-slate-500">Sua lista de compras está vazia.</p>
                        <p className="text-xs text-slate-400">Adicione receitas ao seu cardápio semanal para gear uma lista.</p>
                        <button
                            onClick={() => navigate('/planner')}
                            className="px-6 py-2 bg-primary text-black font-bold rounded-xl mt-2"
                        >
                            Ir para Planejador
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-6 p-5 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-primary">Lista Atual</h3>
                                <p className="text-xs text-primary/70 font-medium uppercase tracking-wider">{items.length} itens por comprar</p>
                            </div>
                            <button
                                onClick={() => navigate('/cart')}
                                className="size-12 rounded-2xl bg-primary text-background-dark flex items-center justify-center shadow-lg shadow-primary/20"
                            >
                                <ShoppingCart size={24} />
                            </button>
                        </div>

                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-[0.1em] ml-2 mb-4">Itens da Semana</h4>
                        <div className="space-y-1">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-white/5 last:border-0">
                                    <span className="font-medium">{item.nome_item}</span>
                                    <span className="text-sm font-bold text-primary">{item.quantidade_exibicao} {item.unidade_exibicao}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Navigation />
        </div>
    );
};

export default SavedLists;
