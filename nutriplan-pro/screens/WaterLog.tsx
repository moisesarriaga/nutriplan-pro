import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useWaterNotifications } from '../../hooks/useWaterNotifications';
import { ArrowLeft, Bell } from 'lucide-react';
import { WATER_PROGRESS_COLORS } from '../../constants';

const WaterLog: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentWater, setCurrentWater] = useState(0);
    const [visualWater, setVisualWater] = useState(0);
    const [goal, setGoal] = useState(2000);
    const [loading, setLoading] = useState(true);
    const { permission, requestPermission, scheduleWaterReminders } = useWaterNotifications();
    const [remindersActive, setRemindersActive] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState(120);
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepEnd, setSleepEnd] = useState('07:00');
    const [showSubtractMenu, setShowSubtractMenu] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [hasSubtracted, setHasSubtracted] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWaterData();
        }
    }, [user]);

    // Verifica mudança de dia a cada minuto
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            // Se for exatamente meia-noite, recarrega os dados (o que acionará o reset se necessário)
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                fetchWaterData();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [user]);

    // Efeito para gerenciar o agendamento dos lembretes
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        if (remindersActive && permission === 'granted') {
            console.log('Agendando lembretes:', { intervalMinutes, sleepStart, sleepEnd });
            cleanup = scheduleWaterReminders(intervalMinutes, sleepStart, sleepEnd);
        }

        return () => {
            if (cleanup) {
                console.log('Limpando agendamento de lembretes');
                cleanup();
            }
        };
    }, [remindersActive, intervalMinutes, sleepStart, sleepEnd, permission]);

    const fetchWaterData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfis_usuario')
                .select('consumo_agua_hoje, meta_agua_ml, lembretes_agua, intervalo_agua_minutos, hora_inicio_sono, hora_fim_sono, data_ultimo_reset_agua')
                .eq('id', user?.id)
                .single();

            if (data) {
                // Lógica de reset diário baseada no banco de dados local
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                // Extract only the date part YYYY-MM-DD if it has T... (ISO)
                const lastReset = data.data_ultimo_reset_agua ? data.data_ultimo_reset_agua.split('T')[0] : null;

                if (lastReset !== today) {
                    await supabase
                        .from('perfis_usuario')
                        .update({
                            consumo_agua_hoje: 0,
                            data_ultimo_reset_agua: today
                        })
                        .eq('id', user?.id);

                    setCurrentWater(0);
                } else {
                    setCurrentWater(data.consumo_agua_hoje || 0);
                }

                setGoal(data.meta_agua_ml || 2000);
                setRemindersActive(data.lembretes_agua || false);
                setIntervalMinutes(data.intervalo_agua_minutos || 120);

                if (data.hora_inicio_sono) setSleepStart(data.hora_inicio_sono.substring(0, 5));
                if (data.hora_fim_sono) setSleepEnd(data.hora_fim_sono.substring(0, 5));

                // Initialize visualWater on first load
                setVisualWater(data.consumo_agua_hoje || 0);
            }
        } finally {
            setLoading(false);
        }
    };

    const waterStats = useMemo(() => {
        const laps = Math.floor(visualWater / goal);
        const percentage = goal > 0 ? ((visualWater % goal) / goal) * 100 : 0;
        return { laps, percentage };
    }, [visualWater, goal]);

    // Sequential animation effect
    useEffect(() => {
        if (visualWater < currentWater) {
            // Calculate the next 100% boundary
            const currentLapEnd = (Math.floor(visualWater / goal) + 1) * goal;
            const target = Math.min(currentLapEnd, currentWater);

            const timeout = setTimeout(() => {
                setVisualWater(target);
            }, (visualWater > 0 && visualWater % goal === 0) ? 300 : 16); // Faster but smoother (60fps) targets

            return () => clearTimeout(timeout);
        } else if (visualWater > currentWater) {
            // Instant reset if zerar is clicked
            setVisualWater(currentWater);
        }
    }, [currentWater, visualWater, goal]);

    const addWater = async (amount: number) => {
        if (!user) return;

        const previousWater = currentWater;
        const newAmount = currentWater + amount;

        // Optimistic update
        setCurrentWater(newAmount);

        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // 1. Update profile (Primary goal)
            const { error: profileError } = await supabase
                .from('perfis_usuario')
                .update({
                    consumo_agua_hoje: newAmount,
                    data_ultimo_reset_agua: today
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Profile update error:', profileError);
                throw new Error('Falha ao atualizar perfil');
            }

            // 2. Update history table (Secondary, non-blocking for the user)
            // We do this in a separate try-catch so it doesn't revert the UI if the table is missing
            try {
                const { error: historyError } = await supabase
                    .from('historico_consumo_agua')
                    .upsert({
                        usuario_id: user.id,
                        data: today,
                        quantidade_ml: newAmount
                    }, {
                        onConflict: 'usuario_id,data'
                    });

                if (historyError) {
                    console.warn('History table update failed (maybe table is missing?):', historyError);
                }
            } catch (hError) {
                console.warn('Silent error updating history:', hError);
            }

            // 3. Log detailed timestamped entry
            try {
                await supabase
                    .from('water_logs')
                    .insert({
                        usuario_id: user.id,
                        quantidade_ml: amount,
                        created_at: new Date().toISOString()
                    });
            } catch (logError) {
                console.warn('Silent error logging water timestamp:', logError);
            }

        } catch (error) {
            console.error('Final addWater catch:', error);
            // Revert on error only if the primary update failed
            setCurrentWater(previousWater);
            alert('Erro ao salvar consumo. Verifique sua conexão e tente novamente.');
        }
    };

    const resetWater = async () => {
        if (!user) return;

        const previousWater = currentWater;
        setCurrentWater(0);

        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // 1. Update profile
            const { error: profileError } = await supabase
                .from('perfis_usuario')
                .update({
                    consumo_agua_hoje: 0,
                    data_ultimo_reset_agua: today
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update history table (non-blocking)
            try {
                await supabase
                    .from('historico_consumo_agua')
                    .upsert({
                        usuario_id: user.id,
                        data: today,
                        quantidade_ml: 0
                    }, {
                        onConflict: 'usuario_id,data'
                    });
            } catch (hError) {
                console.warn('Silent error during reset history:', hError);
            }

            // 3. Delete detailed logs for today
            try {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                await supabase
                    .from('water_logs')
                    .delete()
                    .eq('usuario_id', user.id)
                    .gte('created_at', todayStart.toISOString());
            } catch (logError) {
                console.warn('Silent error resetting water logs:', logError);
            }

        } catch (error) {
            console.error('Reset water error:', error);
            setCurrentWater(previousWater);
            alert('Erro ao zerar consumo. Tente novamente.');
        }
    };

    const subtractWater = async (amount: number) => {
        if (!user) return;

        const previousWater = currentWater;
        const newAmount = Math.max(0, currentWater - amount);

        setCurrentWater(newAmount);

        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const { error: profileError } = await supabase
                .from('perfis_usuario')
                .update({
                    consumo_agua_hoje: newAmount,
                    data_ultimo_reset_agua: today
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            try {
                await supabase
                    .from('historico_consumo_agua')
                    .upsert({
                        usuario_id: user.id,
                        data: today,
                        quantidade_ml: newAmount
                    }, {
                        onConflict: 'usuario_id,data'
                    });
            } catch (hError) {
                console.warn('Silent error during subtract history:', hError);
            }

            // 3. Log detailed timestamped entry (negative amount)
            try {
                await supabase
                    .from('water_logs')
                    .insert({
                        usuario_id: user.id,
                        quantidade_ml: -amount,
                        created_at: new Date().toISOString()
                    });
            } catch (logError) {
                console.warn('Silent error logging water subtract timestamp:', logError);
            }

            setHasSubtracted(true);
        } catch (error) {
            console.error('Subtract water error:', error);
            setCurrentWater(previousWater);
            alert('Erro ao subtrair consumo.');
        }
    };

    const saveSettings = async () => {
        if (!user) return;

        await supabase
            .from('perfis_usuario')
            .update({
                meta_agua_ml: goal,
                intervalo_agua_minutos: intervalMinutes,
                hora_inicio_sono: sleepStart,
                hora_fim_sono: sleepEnd
            })
            .eq('id', user.id);

        setShowSettings(false);
    };



    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white pb-10">
            <header className="p-4 flex items-center justify-between sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Registro de Água</h1>
                </div>
                <button
                    onClick={() => navigate('/water-history')}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-blue-500 flex items-center justify-center"
                    title="Histórico de Consumo"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>bar_chart_4_bars</span>
                </button>
            </header>

            <div className="flex-1 px-4 flex flex-col items-center justify-center py-10">
                <div className="relative size-64 mb-10 group">
                    <div className={`absolute inset-0 rounded-full transition-all duration-700 ${waterStats.percentage === 0 && waterStats.laps > 0 ? 'shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105' : 'shadow-none'}`} />
                    <svg className={`size-full -rotate-90 transform transition-transform duration-500 ${(waterStats.percentage === 0 && waterStats.laps > 0) ? 'scale-110' : 'scale-100'}`}>
                        {/* Background grey circle - only visible on lap 0 */}
                        <circle
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="16"
                            stroke="currentColor"
                            fill="transparent"
                            r="120"
                            cx="128"
                            cy="128"
                        />

                        {/* Rendering one layer for each lap reached */}
                        {Array.from({ length: waterStats.laps + 1 }).map((_, lapIndex) => {
                            // Cycle through colors
                            const color = WATER_PROGRESS_COLORS[lapIndex % WATER_PROGRESS_COLORS.length];

                            // If it's a previous lap, it's 100% full. Otherwise, it's the current percentage.
                            const lapPercent = lapIndex < waterStats.laps ? 100 : waterStats.percentage;

                            return (
                                <circle
                                    key={`lap-${lapIndex}`}
                                    style={{ color }}
                                    className="transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
                                    strokeWidth={lapIndex === waterStats.laps ? 16 : 14}
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - lapPercent / 100)}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="120"
                                    cx="128"
                                    cy="128"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center w-12 h-12">
                            <span className="material-symbols-outlined text-blue-500 absolute -translate-x-3 -translate-y-1" style={{ fontSize: '42px', fontVariationSettings: "'FILL' 0, 'wght' 600" }}>water_drop</span>
                            <span className="material-symbols-outlined text-blue-500 relative z-10 translate-x-1 translate-y-1" style={{ fontSize: '42px', fontVariationSettings: "'FILL' 1, 'wght' 600" }}>water_drop</span>
                        </div>
                        <span className="text-4xl font-black mt-2">{(Math.max(0, visualWater) / 1000).toFixed(1)}L</span>
                        <span className="text-slate-500 text-sm">da meta de {(goal / 1000).toFixed(1)}L</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {[200, 300, 500].map((amount) => (
                        <button
                            key={amount}
                            onClick={() => addWater(amount)}
                            className="flex flex-col items-center justify-between gap-2 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition min-h-[100px]"
                        >
                            <div className="flex-1 flex items-center justify-center">
                                <span
                                    className="material-symbols-outlined text-blue-500"
                                    style={{
                                        fontSize: amount === 200 ? '24px' : amount === 300 ? '32px' : '40px',
                                        fontVariationSettings: "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                                    }}
                                >
                                    water_full
                                </span>
                            </div>
                            <span className="font-bold shrink-0">{amount}ml</span>
                        </button>
                    ))}
                </div>

                <div className={`mt-6 relative w-full max-w-sm transition-all duration-300 ${showSubtractMenu ? 'h-[90px]' : 'h-10'}`}>
                    {!showSubtractMenu ? (
                        <div className="absolute inset-0 grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-500 ease-out fill-mode-forwards">
                            <button
                                onClick={() => currentWater > 0 && setShowResetConfirm(true)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition text-slate-500 font-bold text-sm h-10"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'wght' 600" }}>restart_alt</span>
                                Zerar
                            </button>
                            <button
                                onClick={() => setShowSubtractMenu(true)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition text-slate-500 font-bold text-sm h-10"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'wght' 600" }}>remove</span>
                                Menos
                            </button>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out fill-mode-forwards">
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {[200, 300, 500].map((amount) => (
                                    <button
                                        key={`sub-${amount}`}
                                        onClick={() => subtractWater(amount)}
                                        className="flex items-center justify-center p-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 active:scale-95 transition text-red-500 font-bold text-sm h-10"
                                    >
                                        -{amount}ml
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setShowSubtractMenu(false);
                                    setHasSubtracted(false);
                                }}
                                className={`text-xs font-bold p-2 transition-colors ${hasSubtracted ? 'text-blue-500 hover:text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {hasSubtracted ? 'Ok' : 'Cancelar'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 w-full max-w-[400px]">
                    <div className="flex items-stretch gap-3">
                        <div className="flex-1 flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Bell className="text-blue-500" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">Lembretes</p>
                                <p className="text-[10px] font-bold text-slate-400">
                                    A cada {intervalMinutes >= 60 ? `${intervalMinutes / 60}h` : `${intervalMinutes}min`}
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    const newStatus = !remindersActive;
                                    if (newStatus && permission !== 'granted') {
                                        const granted = await requestPermission();
                                        if (!granted) return;
                                    }

                                    setRemindersActive(newStatus);

                                    // Save to Supabase
                                    await supabase
                                        .from('perfis_usuario')
                                        .update({ lembretes_agua: newStatus })
                                        .eq('id', user?.id);
                                }}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${remindersActive ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${remindersActive ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all text-slate-400 hover:text-blue-500"
                        >
                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '24px' }}>settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md p-6 rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Configurar Lembretes</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6 pb-6">
                            <section>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-3">Meta Diária (ml)</label>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="number"
                                        value={goal}
                                        onChange={(e) => setGoal(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ex: 2000"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {[2000, 2500, 3000].map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => setGoal(preset)}
                                                className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg border transition-all ${goal === preset
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                                                    }`}
                                            >
                                                {preset / 1000}L
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-3">Frequência das notificações</label>
                                <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                                    {[30, 60, 120, 180, 240, 300].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setIntervalMinutes(mins)}
                                            className={`py-3 px-2 rounded-xl border-2 transition-all font-bold text-sm ${intervalMinutes === mins
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 text-slate-500'
                                                }`}
                                        >
                                            {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-3">Modo Sono (Sem notificações)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Início</span>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={sleepStart}
                                                onChange={(e) => setSleepStart(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Fim</span>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={sleepEnd}
                                                onChange={(e) => setSleepEnd(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-3 italic px-1 leading-tight">
                                    As notificações serão pausadas automaticamente durante esse período.
                                </p>
                            </section>

                            <button
                                onClick={saveSettings}
                                className="w-full py-4 mt-2 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-xs p-6 rounded-[24px] shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-red-500" style={{ fontSize: '32px' }}>warning</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Zerar Consumo?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Deseja realmente zerar todo o seu consumo de água de hoje?
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="py-3 rounded-xl bg-slate-100 dark:bg-white/5 font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        resetWater();
                                        setShowResetConfirm(false);
                                    }}
                                    className="py-3 rounded-xl bg-red-500 text-white font-bold active:scale-95 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Zerar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterLog;
