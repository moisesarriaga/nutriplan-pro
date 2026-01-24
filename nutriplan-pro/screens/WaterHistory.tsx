import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

type Period = 'dia' | 'semana' | 'mês' | 'ano';

interface HistoryRecord {
    data: string;
    quantidade_ml: number;
}

const WaterHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [period, setPeriod] = useState<Period>('dia');
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [goal, setGoal] = useState(2000);
    const [todayConsumption, setTodayConsumption] = useState(0);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();

            // Set up real-time subscriptions
            const profileSubscription = supabase
                .channel('profile_changes')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'perfis_usuario',
                    filter: `id=eq.${user.id}`
                }, (payload) => {
                    const updatedProfile = payload.new;
                    setGoal(updatedProfile.meta_agua_ml);
                    setTodayConsumption(updatedProfile.consumo_agua_hoje || 0);
                    setUserName(updatedProfile.nome || '');
                })
                .subscribe();

            const historySubscription = supabase
                .channel('history_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'historico_consumo_agua',
                    filter: `usuario_id=eq.${user.id}`
                }, () => {
                    // Refetch history when anything changes in the history table
                    fetchData();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(profileSubscription);
                supabase.removeChannel(historySubscription);
            };
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch goal and real-time today consumption
            const { data: profile } = await supabase
                .from('perfis_usuario')
                .select('meta_agua_ml, nome, consumo_agua_hoje')
                .eq('id', user?.id)
                .single();
            if (profile) {
                setGoal(profile.meta_agua_ml);
                setTodayConsumption(profile.consumo_agua_hoje || 0);
                setUserName(profile.nome || '');
            }

            // Fetch history for the last 30 days to calculate stats
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const startStr = startDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('historico_consumo_agua')
                .select('data, quantidade_ml')
                .eq('usuario_id', user?.id)
                .gte('data', startStr)
                .order('data', { ascending: true });

            if (data) {
                setHistory(data);
            }
        } catch (err) {
            console.error('Error fetching water history:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Statistics
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        // Merge today's real-time data into a virtual combined history if not present
        const processedHistory = [...history];
        const existingToday = processedHistory.find(h => h.data === todayStr);
        if (!existingToday && todayConsumption > 0) {
            processedHistory.push({ data: todayStr, quantidade_ml: todayConsumption });
        } else if (existingToday) {
            existingToday.quantidade_ml = Math.max(existingToday.quantidade_ml, todayConsumption);
        }

        const yesterdayRecord = processedHistory.find(h => h.data === yesterdayStr);
        const currentWater = todayConsumption;
        const yesterdayWater = yesterdayRecord?.quantidade_ml || 0;

        // vs ontem %
        let vsOntem = 0;
        let diffLabel = "";

        if (yesterdayWater > 0) {
            vsOntem = Math.round(((currentWater - yesterdayWater) / yesterdayWater) * 100);
            diffLabel = `${vsOntem >= 0 ? '+' : ''}${vsOntem}% vs ontem`;
        } else if (currentWater > 0) {
            vsOntem = 100;
            diffLabel = `+${currentWater.toLocaleString()}ml vs ontem`;
        } else {
            diffLabel = "Inicie agora!";
        }

        // Média Semanal (including today)
        const last7Days = processedHistory.slice(-7);
        const avgWeekly = last7Days.length > 0
            ? Math.round(last7Days.reduce((a, b) => a + b.quantidade_ml, 0) / 7)
            : 0;

        // Sequência (Streak) - Consecutive days with records > 0
        let streak = 0;
        const sortedHistory = [...processedHistory].sort((a, b) => b.data.localeCompare(a.data));

        // Check if there's any record at all
        if (sortedHistory.length > 0) {
            // Start from today or the most recent day
            let expectedDate = new Date();
            // If today has no record, start from yesterday
            if (todayConsumption === 0 && sortedHistory[0].data !== todayStr) {
                expectedDate.setDate(expectedDate.getDate() - 1);
            }

            for (const record of sortedHistory) {
                const recordDate = new Date(record.data + 'T00:00:00');
                const diffDays = Math.floor((expectedDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 0 && record.quantidade_ml > 0) {
                    streak++;
                    expectedDate.setDate(expectedDate.getDate() - 1);
                } else if (diffDays > 0) {
                    // Gap found
                    break;
                }
            }
        }

        return {
            today: currentWater,
            vsOntem,
            diffLabel,
            avgWeekly,
            streak,
            goal
        };
    }, [history, todayConsumption, goal]);

    const chartData = useMemo(() => {
        // Map history to chart format
        // For the "Daily" view, we'll show the last 7 entries with time-like labels or just days
        // The mock image shows hours (8:00, 9:00...), but our DB stores daily aggregations.
        // I will use days for better accuracy, or split today's data if I had hourly logs.
        // Since we only have daily logs, I'll show the last 10 days for 'dia' view.

        let sliceCount = 7;
        if (period === 'dia') sliceCount = 7;
        else if (period === 'semana') sliceCount = 14;
        else sliceCount = 30;

        return history.slice(-sliceCount).map(item => ({
            name: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            fullDate: new Date(item.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
            ml: item.quantidade_ml,
            rawDate: item.data
        }));
    }, [history, period]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{payload[0].payload.fullDate}</p>
                    <p className="text-lg font-black text-blue-500">{payload[0].value.toLocaleString()}ml</p>
                    <div className="flex items-center gap-1 mt-1">
                        <div className={`size-1.5 rounded-full ${payload[0].value >= goal ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <p className="text-[10px] text-slate-500">{payload[0].value >= goal ? 'Meta batida' : `Faltam ${(goal - payload[0].value) > 0 ? (goal - payload[0].value) : 0}ml`}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F0F7FA] dark:bg-background-dark text-slate-900 dark:text-white pb-10 transition-colors duration-500">
            <header className="px-6 pt-10 pb-6">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 active:scale-95 transition-all outline-none"
                        title="Ver Perfil"
                    >
                        <span className="material-symbols-outlined text-blue-500 text-[24px]">person</span>
                    </button>
                </div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                    Olá, {userName || 'Atleta'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Mantenha-se hidratado e acompanhe seu progresso.
                </p>
            </header>

            {/* Stat Cards Row */}
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4 cursor-grab active:cursor-grabbing">
                {/* Card Hoje */}
                <div className="min-w-[160px] bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoje</span>
                        <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>water_drop</span>
                        </div>
                    </div>
                    <p className="text-xl font-black mb-1">{stats.today.toLocaleString()}ml</p>
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${stats.vsOntem >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="material-symbols-outlined text-[14px]">{stats.vsOntem >= 0 ? 'trending_up' : 'trending_down'}</span>
                        {stats.diffLabel}
                    </div>
                </div>

                {/* Card Média */}
                <div className="min-w-[160px] bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Média Semanal</span>
                        <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 text-[18px]">show_chart</span>
                        </div>
                    </div>
                    <p className="text-xl font-black mb-1">{stats.avgWeekly.toLocaleString()}ml</p>
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${stats.avgWeekly >= goal ? 'text-green-500' : 'text-blue-500'}`}>
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        {stats.avgWeekly >= goal ? 'Na meta' : 'Quase lá'}
                    </div>
                </div>

                {/* Card Sequência */}
                <div className="min-w-[160px] bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sequência</span>
                        <div className="size-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">emoji_events</span>
                        </div>
                    </div>
                    <p className="text-xl font-black mb-1">{stats.streak} Dias</p>
                    <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold">
                        Fogo! 🔥
                    </div>
                </div>

                {/* Card Meta */}
                <div className="min-w-[160px] bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta Diária</span>
                        <div className="size-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-500 text-[18px]">trending_up</span>
                        </div>
                    </div>
                    <p className="text-xl font-black mb-1">{stats.goal.toLocaleString()}ml</p>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                        Padrão
                    </div>
                </div>
            </div>

            {/* Graph Card */}
            <div className="px-6 mt-6">
                <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-lg tracking-tight">Histórico de Hidratação</h3>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-full items-center">
                            {(['dia', 'semana', 'mês', 'ano'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 text-[11px] font-black rounded-full transition-all duration-300 ${period === p
                                        ? 'bg-white dark:bg-surface-dark shadow-md text-slate-900 dark:text-white'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMl" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                    tickFormatter={(value) => `${value}ml`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <ReferenceLine y={goal} stroke="#3B82F6" strokeDasharray="10 10" opacity={0.2} label={{ position: 'right', value: 'Meta', fill: '#3B82F6', fontSize: 10, fontWeight: 700 }} />
                                <Area
                                    type="monotone"
                                    dataKey="ml"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorMl)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consumo Real</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">Dados baseados nos últimos registros</p>
                    </div>
                </div>
            </div>

            {/* Quote of the day */}
            <div className="mx-6 mt-8 p-6 rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20">
                <p className="font-bold text-sm leading-relaxed italic">
                    "A água é o combustível da vida. Mantenha seu motor rodando suavemente!"
                </p>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">💡 Dica do dia</span>
                </div>
            </div>
        </div>
    );
};

export default WaterHistory;
