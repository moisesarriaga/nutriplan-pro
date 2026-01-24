
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { useNotification } from '../../contexts/NotificationContext';
import { ArrowLeft, ShoppingBasket, ChevronRight, History, RefreshCcw } from 'lucide-react';

interface ShoppingListHistoryGroup {
    id: string;
    originalName: string;
    name: string;
    itemCount: number;
    totalPrice: number;
    createdAt: Date;
}

const MealHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [groups, setGroups] = useState<ShoppingListHistoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Recreate states
    const [showRecreateModal, setShowRecreateModal] = useState(false);
    const [groupToRecreate, setGroupToRecreate] = useState<ShoppingListHistoryGroup | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
    const [isRecreating, setIsRecreating] = useState(false);

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
                originalName: group.name,
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

    const handleRecreateClick = (group: ShoppingListHistoryGroup, e: React.MouseEvent) => {
        e.stopPropagation();
        setGroupToRecreate(group);
        setNewGroupName(group.name);
        setShowRecreateModal(true);
    };

    const checkAndPrepareRecreate = async () => {
        if (!newGroupName.trim() || !user) return;

        // Validation: Search for any active group (concluido=false) with this display name
        const { data: existingGroups, error } = await supabase
            .from('lista_precos_mercado')
            .select('grupo_nome')
            .eq('usuario_id', user.id)
            .eq('concluido', false)
            .ilike('grupo_nome', `${newGroupName.trim()} ::: %`)
            .limit(1);

        if (existingGroups && existingGroups.length > 0) {
            setShowDuplicateConfirm(true);
        } else {
            handleRecreateList();
        }
    };

    const handleRecreateList = async () => {
        if (!user || !groupToRecreate) return;
        setIsRecreating(true);

        try {
            // 1. Fetch all items from the original history group
            const { data: originalItems, error: fetchError } = await supabase
                .from('lista_precos_mercado')
                .select('*')
                .eq('usuario_id', user.id)
                .eq('grupo_nome', groupToRecreate.originalName);

            if (fetchError) throw fetchError;
            if (!originalItems || originalItems.length === 0) {
                showNotification('Não foi possível encontrar itens para recriar esta lista.', { iconType: 'warning' });
                return;
            }

            // 2. Prepare new items for insertion
            const timestamp = Date.now();
            const newFullGroupName = `${newGroupName.trim()} ::: ${timestamp}`;

            const newItems = originalItems.map(item => ({
                usuario_id: user.id,
                nome_item: item.nome_item,
                quantidade: item.quantidade,
                ultimo_preco_informado: item.ultimo_preco_informado,
                unidade_preco: item.unidade_preco,
                comprado: false, // Reset comprado status
                concluido: false, // Make it active
                grupo_nome: newFullGroupName
            }));

            // 3. Insert new items
            const { error: insertError } = await supabase
                .from('lista_precos_mercado')
                .insert(newItems);

            if (insertError) throw insertError;

            showNotification(`Lista "${newGroupName}" recriada com sucesso!`, { iconType: 'success' });
            setShowRecreateModal(false);
            setShowDuplicateConfirm(false);

            // 4. Navigate to the new active list
            navigate(`/cart/${encodeURIComponent(newFullGroupName)}`, { replace: true });
        } catch (err) {
            console.error('Error recreating list:', err);
            showNotification('Erro ao recriar lista. Tente novamente.', { iconType: 'error' });
        } finally {
            setIsRecreating(false);
        }
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

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleRecreateClick(group, e)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Recriar Lista"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Recriar Lista */}
            {showRecreateModal && !showDuplicateConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-2 text-center text-slate-900 dark:text-white">Recriar Lista</h3>
                        <p className="text-sm text-center text-slate-500 mb-6">Esta ação criará uma nova lista de compras ativa baseada nos itens de "{groupToRecreate?.name}".</p>

                        <div className="flex flex-col gap-2 mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome da Nova Lista</label>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && checkAndPrepareRecreate()}
                                placeholder="Nome da lista..."
                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRecreateModal(false)}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                disabled={isRecreating}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={checkAndPrepareRecreate}
                                disabled={!newGroupName.trim() || isRecreating}
                                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {isRecreating ? (
                                    <div className="size-5 animate-spin rounded-full border-2 border-background-dark border-t-transparent"></div>
                                ) : (
                                    'Recriar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Nome Duplicado */}
            {showDuplicateConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                                <span className="material-symbols-rounded text-[32px]">warning</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Nome já existe</h3>
                            <p className="text-sm text-slate-500 mb-6 px-2">
                                Já existe uma lista ativa chamada "<span className="font-bold text-slate-800 dark:text-white">{newGroupName}</span>". Deseja criar outra lista com o mesmo nome?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDuplicateConfirm(false)}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-slate-800"
                            >
                                Não
                            </button>
                            <button
                                onClick={handleRecreateList}
                                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                            >
                                Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navigation />
        </div>
    );
};

export default MealHistory;
