import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, X, Zap, Calendar, Clock } from 'lucide-react';

interface MealPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeId: string | number;
    recipeName: string;
    onSuccess?: () => void;
}

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({
    isOpen,
    onClose,
    recipeId,
    recipeName,
    onSuccess
}) => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [isAdding, setIsAdding] = useState(false);
    const [plannerData, setPlannerData] = useState({
        day: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()],
        mealType: 'Almoço'
    });

    if (!isOpen) return null;

    const handleAddToPlanner = async () => {
        if (!user || !recipeId) return;
        setIsAdding(true);

        try {
            const { error } = await supabase.from('cardapio_semanal').insert({
                usuario_id: user.id,
                dia_semana: plannerData.day,
                tipo_refeicao: plannerData.mealType,
                receita_id: recipeId
            });

            if (error) throw error;

            showNotification(`${recipeName} adicionada ao seu plano de ${plannerData.day}!`, { iconType: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error adding to planner:', err);
            showNotification('Erro ao adicionar ao plano: ' + err.message, { iconType: 'error' });
        } finally {
            setIsAdding(false);
        }
    };

    const days = [
        { short: 'Seg', full: 'Segunda' },
        { short: 'Ter', full: 'Terça' },
        { short: 'Qua', full: 'Quarta' },
        { short: 'Qui', full: 'Quinta' },
        { short: 'Sex', full: 'Sexta' },
        { short: 'Sáb', full: 'Sábado' },
        { short: 'Dom', full: 'Domingo' }
    ];

    const mealTypes = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Planejar Refeição</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100 dark:border-white/5 mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receita</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{recipeName}</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 flex items-center gap-1">
                            <Calendar size={10} /> Dia da Semana
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {days.map(day => (
                                <button
                                    key={day.full}
                                    onClick={() => setPlannerData(prev => ({ ...prev, day: day.full }))}
                                    className={`px-2 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${plannerData.day === day.full
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-50 dark:border-white/5 text-slate-400 hover:border-slate-100 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 flex items-center gap-1">
                            <Clock size={10} /> Tipo de Refeição
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {mealTypes.map(meal => (
                                <button
                                    key={meal}
                                    onClick={() => setPlannerData(prev => ({ ...prev, mealType: meal }))}
                                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 ${plannerData.mealType === meal
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-50 dark:border-white/5 text-slate-400 hover:border-slate-100 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {meal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAddToPlanner}
                        disabled={isAdding}
                        className="flex-1 h-12 rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        {isAdding ? (
                            <div className="size-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Plus size={18} />
                                Confirmar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MealPlannerModal;
