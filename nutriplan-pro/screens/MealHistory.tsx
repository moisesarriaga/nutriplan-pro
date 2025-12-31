
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradePrompt from '../../components/UpgradePrompt';
import Navigation from '../../components/Navigation';

interface HistoryItem {
    id: string;
    tipo_refeicao: string;
    data_consumo: string;
    calorias: number;
    nome_receita_manual: string;
    receitas?: {
        nome: string;
    } | null;
}

const MealHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { hasFeature } = useSubscription();

    const canTrackCalories = hasFeature('calorie_tracking');

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('historico_refeicoes')
                .select(`
          id,
          tipo_refeicao,
          data_consumo,
          calorias,
          nome_receita_manual,
          receitas (
            nome
          )
        `)
                .eq('usuario_id', user?.id)
                .order('data_consumo', { ascending: false });

            if (error) throw error;
            setHistory(data as any);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold flex-1 text-center">Meu Histórico</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-6xl text-slate-300">history</span>
                        <p className="text-slate-500">Nenhuma refeição registrada ainda.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {item.tipo_refeicao}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {formatDate(item.data_consumo)}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg">{item.receitas?.nome || item.nome_receita_manual || 'Refeição'}</h3>
                                <div
                                    className={`flex items-center gap-1 mt-1 text-sm text-slate-500 ${!canTrackCalories ? 'cursor-pointer' : ''}`}
                                    onClick={!canTrackCalories ? () => setShowUpgradeModal(true) : undefined}
                                >
                                    <span className="material-symbols-outlined text-[16px] text-orange-400">local_fire_department</span>
                                    <span className={!canTrackCalories ? 'blur-[3px] select-none' : ''}>
                                        {item.calorias} kcal
                                    </span>
                                    {!canTrackCalories && <span className="material-symbols-outlined text-[12px] ml-1">lock</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showUpgradeModal && (
                <UpgradePrompt
                    feature="O histórico detalhado de calorias"
                    requiredPlan="simple"
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}
            <Navigation />
        </div>
    );
};

export default MealHistory;
