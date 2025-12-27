import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useWaterNotifications } from '../../hooks/useWaterNotifications';

const WaterLog: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentWater, setCurrentWater] = useState(0);
    const [goal, setGoal] = useState(2000);
    const [loading, setLoading] = useState(true);
    const { permission, requestPermission, scheduleWaterReminders } = useWaterNotifications();
    const [remindersActive, setRemindersActive] = useState(false);

    useEffect(() => {
        if (user) {
            checkAndResetIfNewDay();
            fetchWaterData();
        }
    }, [user]);

    // Check if it's a new day and auto-reset water consumption
    useEffect(() => {
        const checkMidnight = setInterval(() => {
            checkAndResetIfNewDay();
        }, 60000); // Check every minute

        return () => clearInterval(checkMidnight);
    }, [user]);

    const checkAndResetIfNewDay = async () => {
        if (!user) return;

        const today = new Date().toDateString();
        const lastResetDate = localStorage.getItem(`waterlog_last_reset_${user.id}`);

        if (lastResetDate !== today) {
            // It's a new day, reset water consumption
            await supabase
                .from('perfis_usuario')
                .update({ consumo_agua_hoje: 0 })
                .eq('id', user.id);

            localStorage.setItem(`waterlog_last_reset_${user.id}`, today);
            setCurrentWater(0);
        }
    };

    const fetchWaterData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfis_usuario')
                .select('consumo_agua_hoje, meta_agua_ml')
                .eq('id', user?.id)
                .single();

            if (data) {
                setCurrentWater(data.consumo_agua_hoje || 0);
                setGoal(data.meta_agua_ml || 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const addWater = async (amount: number) => {
        const newAmount = currentWater + amount;
        setCurrentWater(newAmount);
        await supabase
            .from('perfis_usuario')
            .update({ consumo_agua_hoje: newAmount })
            .eq('id', user?.id);
    };

    const resetWater = async () => {
        setCurrentWater(0);
        await supabase
            .from('perfis_usuario')
            .update({ consumo_agua_hoje: 0 })
            .eq('id', user?.id);
    };

    const percentage = Math.min(Math.round((currentWater / goal) * 100), 100);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white pb-10">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold">Registro de Água</h1>
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
                            className="text-primary transition-all duration-500 ease-out"
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
                        <span className="material-symbols-outlined text-primary size-12 flex items-center justify-center filled">water_drop</span>
                        <span className="text-4xl font-black mt-2">{(currentWater / 1000).toFixed(1)}L</span>
                        <span className="text-slate-500 text-sm">da meta de {(goal / 1000).toFixed(1)}L</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {[200, 300, 500].map((amount) => (
                        <button
                            key={amount}
                            onClick={() => addWater(amount)}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition"
                        >
                            <span className="material-symbols-outlined text-primary">local_drink</span>
                            <span className="font-bold">{amount}ml</span>
                        </button>
                    ))}
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                    <button
                        onClick={resetWater}
                        className="text-slate-500 text-sm font-medium hover:text-red-500"
                    >
                        Zerar consumo de hoje
                    </button>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary">notifications</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Lembretes de Água</p>
                            <p className="text-xs text-slate-500">Receba notificações a cada 2 horas</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (permission !== 'granted') {
                                    const granted = await requestPermission();
                                    if (granted) {
                                        scheduleWaterReminders();
                                        setRemindersActive(true);
                                    }
                                } else {
                                    if (!remindersActive) {
                                        scheduleWaterReminders();
                                        setRemindersActive(true);
                                    } else {
                                        setRemindersActive(false);
                                    }
                                }
                            }}
                            className={`relative w-12 h-6 rounded-full transition-colors ${remindersActive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${remindersActive ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterLog;
