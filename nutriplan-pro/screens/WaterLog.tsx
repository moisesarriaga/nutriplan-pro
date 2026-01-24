import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useWaterNotifications } from '../../hooks/useWaterNotifications';
import { ArrowLeft, GlassWater, Bell, BarChart2 } from 'lucide-react';

const WaterLog: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentWater, setCurrentWater] = useState(0);
    const [goal, setGoal] = useState(2000);
    const [loading, setLoading] = useState(true);
    const { permission, requestPermission, scheduleWaterReminders } = useWaterNotifications();
    const [remindersActive, setRemindersActive] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [intervalMinutes, setIntervalMinutes] = useState(120);
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepEnd, setSleepEnd] = useState('07:00');

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
            }
        } finally {
            setLoading(false);
        }
    };

    const addWater = (amount: number) => {
        setCurrentWater(prevWater => {
            const newAmount = prevWater + amount;

            // Perform the async operation right here
            (async () => {
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const { error } = await supabase
                    .from('perfis_usuario')
                    .update({
                        consumo_agua_hoje: newAmount,
                        data_ultimo_reset_agua: today
                    })
                    .eq('id', user?.id);

                if (error) {
                    console.error('Failed to update water intake, reverting state.');
                    // Revert the state change if the DB update fails
                    setCurrentWater(p => p - amount);
                } else {
                    // Also update history table
                    await supabase
                        .from('historico_consumo_agua')
                        .upsert({
                            usuario_id: user?.id,
                            data: today,
                            quantidade_ml: newAmount
                        }, {
                            onConflict: 'usuario_id,data'
                        });
                }
            })();

            return newAmount;
        });
    };

    const resetWater = async () => {
        setCurrentWater(0);
        await supabase
            .from('perfis_usuario')
            .update({ consumo_agua_hoje: 0 })
            .eq('id', user?.id);

        // Update history table for today
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        await supabase
            .from('historico_consumo_agua')
            .upsert({
                usuario_id: user?.id,
                data: today,
                quantidade_ml: 0
            }, {
                onConflict: 'usuario_id,data'
            });
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

    const percentage = Math.min(Math.round((currentWater / goal) * 100), 100);

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
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-blue-500"
                    title="Histórico de Consumo"
                >
                    <BarChart2 size={24} />
                </button>
            </header>

            <div className="flex-1 px-4 flex flex-col items-center justify-center py-10">
                <div className="relative size-64 mb-10">
                    <svg className="size-full -rotate-90 transform">
                        <circle
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="12"
                            stroke="currentColor"
                            fill="transparent"
                            r="120"
                            cx="128"
                            cy="128"
                        />
                        <circle
                            className="text-blue-500 transition-all duration-500 ease-out"
                            strokeWidth="12"
                            strokeDasharray={2 * Math.PI * 120}
                            strokeDashoffset={2 * Math.PI * 120 * (1 - percentage / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="120"
                            cx="128"
                            cy="128"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center w-12 h-12">
                            <span className="material-symbols-outlined text-blue-500 absolute -translate-x-3 -translate-y-1" style={{ fontSize: '42px', fontVariationSettings: "'FILL' 0" }}>water_drop</span>
                            <span className="material-symbols-outlined text-blue-500 relative z-10 translate-x-1 translate-y-1" style={{ fontSize: '42px', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                        </div>
                        <span className="text-4xl font-black mt-2">{(currentWater / 1000).toFixed(1)}L</span>
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
                                <GlassWater
                                    className="text-blue-500"
                                    size={amount === 200 ? 20 : amount === 300 ? 28 : 36}
                                />
                            </div>
                            <span className="font-bold shrink-0">{amount}ml</span>
                        </button>
                    ))}
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                    <button
                        onClick={resetWater}
                        className="text-slate-500 text-sm font-medium hover:text-red-500 transition-colors"
                    >
                        Zerar consumo de hoje
                    </button>

                    <div className="flex items-stretch gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 min-w-[280px]">
                            <Bell className="text-blue-500" size={24} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Lembretes de Água</p>
                                <p className="text-xs text-slate-500">
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
                                className={`relative w-12 h-6 rounded-full transition-colors ${remindersActive ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${remindersActive ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center justify-center px-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '24px' }}>settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md p-6 rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Configurar Lembretes</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <section>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-3">Meta Diária (ml)</label>
                                <div className="flex gap-3 mb-3">
                                    <input
                                        type="number"
                                        value={goal}
                                        onChange={(e) => setGoal(Number(e.target.value))}
                                        className="flex-1 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ex: 2000"
                                    />
                                    <div className="flex flex-col gap-2">
                                        {[2000, 3000].map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => setGoal(preset)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${goal === preset
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
                                <div className="grid grid-cols-3 gap-3">
                                    {[30, 60, 120, 180, 240, 300].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setIntervalMinutes(mins)}
                                            className={`py-2 px-3 rounded-xl border-2 transition-all font-medium text-sm ${intervalMinutes === mins
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                                }`}
                                        >
                                            {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-3">Modo Sono (Sem notificações)</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <span className="text-xs text-slate-400 block mb-1">Início</span>
                                        <input
                                            type="time"
                                            value={sleepStart}
                                            onChange={(e) => setSleepStart(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs text-slate-400 block mb-1">Fim</span>
                                        <input
                                            type="time"
                                            value={sleepEnd}
                                            onChange={(e) => setSleepEnd(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic px-1">
                                    As notificações serão pausadas automaticamente durante esse período.
                                </p>
                            </section>

                            <button
                                onClick={saveSettings}
                                className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterLog;
