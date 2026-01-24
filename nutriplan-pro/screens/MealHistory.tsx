
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { ArrowLeft, ShoppingBasket, ChevronRight, History } from 'lucide-react';

interface ShoppingListHistoryGroup {
    id: string;
    name: string;
    itemCount: number;
    totalPrice: number;
    createdAt: Date;
}

const MealHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [groups, setGroups] = useState<ShoppingListHistoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('lista_precos_mercado')
                .select('*')
                .eq('usuario_id', user?.id)
                .eq('concluido', true);

            if (error) throw error;

            if (!data) {
                setGroups([]);
                return;
            }

            // Group items by grupo_nome
            const groupedByName = data.reduce((acc: any, item: any) => {
                const groupKey = item.grupo_nome || 'Sem Grupo';

                if (!acc[groupKey]) {
                    acc[groupKey] = {
                        id: groupKey,
                        name: groupKey,
                        items: [],
                        createdAt: new Date(item.created_at || Date.now())
                    };
                }

                acc[groupKey].items.push(item);
                return acc;
            }, {});

            // Convert to array and calculate stats
            const groupsArray: ShoppingListHistoryGroup[] = Object.values(groupedByName).map((group: any) => ({
                id: group.id,
                name: group.name.split(' ::: ')[0], // Strip unique suffix for display
                itemCount: group.items.length,
                totalPrice: group.items.reduce((sum: number, item: any) => sum + (item.ultimo_preco_informado || 0), 0),
                createdAt: group.createdAt
            }));

            // Sort by creation date (newest first)
            groupsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setGroups(groupsArray);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center">Meu Histórico</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <div className="size-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2">
                            <History className="text-slate-300" size={40} />
                        </div>
                        <p className="text-slate-500">Nenhuma lista foi registrada ainda.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => navigate(`/cart/${encodeURIComponent(group.id)}`)}
                                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30"
                            >
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5">
                                    <span className="material-symbols-rounded text-slate-400 text-[28px]">done_all</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold mb-1 text-slate-500">{group.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <ShoppingBasket size={12} />
                                            {group.itemCount} {group.itemCount === 1 ? 'item' : 'itens'}
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium text-primary">R$ {group.totalPrice.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Finalizada em {formatDate(group.createdAt)}
                                    </p>
                                </div>

                                <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Navigation />
        </div>
    );
};

export default MealHistory;
