import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, User, Droplets, TrendingUp, TrendingDown, BarChart2, Sparkles, Flame, Target } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar
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
    const [logsVersion, setLogsVersion] = useState(0);

    const fetchData = useCallback(async () => {
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
    }, [user]);

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

            const logsSubscription = supabase
                .channel('logs_changes')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'water_logs',
                    filter: `usuario_id=eq.${user.id}`
                }, () => {
                    setLogsVersion(v => v + 1);
                    fetchData(); // Sync profile/history on log change
                })
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'water_logs',
                    filter: `usuario_id=eq.${user.id}`
                }, () => {
                    setLogsVersion(v => v + 1);
                    fetchData(); // Sync profile/history on log change
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
                    fetchData();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(profileSubscription);
                supabase.removeChannel(logsSubscription);
                supabase.removeChannel(historySubscription);
            };
        }
    }, [user, fetchData]);

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

    const [graphData, setGraphData] = useState<any[]>([]);

    useEffect(() => {
        const fetchGraphData = async () => {
            if (!user) return;

            if (period === 'dia') {
                // Fetch detailed logs for today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { data: logs } = await supabase
                    .from('water_logs')
                    .select('created_at, quantidade_ml')
                    .eq('usuario_id', user.id)
                    .gte('created_at', todayStart.toISOString())
                    .order('created_at', { ascending: true });

                if (logs) {
                    // Create hourly buckets (cumulative)
                    const hourlyData: any[] = [];
                    let currentTotal = 0;

                    // Initialize hours 0-23
                    const hoursMap = new Map();
                    for (let i = 0; i <= 23; i++) {
                        hoursMap.set(i, 0);
                    }

                    // Fill map
                    logs.forEach(log => {
                        const date = new Date(log.created_at);
                        const hour = date.getHours();
                        if (hoursMap.has(hour)) {
                            hoursMap.set(hour, hoursMap.get(hour) + log.quantidade_ml);
                        }
                    });

                    // Generate hourly data for graph (NON-CUMULATIVE)
                    const now = new Date();
                    const currentHour = now.getHours();

                    for (let i = 0; i <= 23; i++) {
                        // Only process if in valid display range (e.g. up to current hour)
                        const amount = hoursMap.get(i);

                        if (i <= currentHour) {
                            hourlyData.push({
                                name: `${i}:00`,
                                fullDate: `Hoje às ${i}:00`,
                                ml: amount, // Discrete amount
                                rawDate: new Date().setHours(i, 0, 0, 0)
                            });
                        } else {
                            // Future hours: add placeholder for Axis but no data
                            hourlyData.push({
                                name: `${i}:00`,
                                fullDate: `Hoje às ${i}:00`,
                                ml: null,
                                rawDate: new Date().setHours(i, 0, 0, 0)
                            });
                        }
                    }

                    setGraphData(hourlyData);
                }
            } else if (period === 'semana') {
                // Last 7 days from History
                const slice = history.slice(-7);
                setGraphData(slice.map(item => ({
                    name: new Date(item.data).toLocaleDateString('pt-BR', { weekday: 'short' }),
                    fullDate: new Date(item.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
                    ml: item.quantidade_ml,
                    rawDate: item.data
                })));
            } else if (period === 'mês') {
                // Fetch current month aggregation (1st to last day)
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0); // Last day of month

                const { data: monthLogs } = await supabase
                    .from('historico_consumo_agua')
                    .select('data, quantidade_ml')
                    .eq('usuario_id', user.id)
                    .gte('data', firstDay.toISOString().split('T')[0])
                    .lte('data', lastDay.toISOString().split('T')[0])
                    .order('data', { ascending: true });

                const daysInMonth = lastDay.getDate();
                const monthlyChartData: any[] = [];
                const logsMap = new Map();

                if (monthLogs) {
                    monthLogs.forEach(log => {
                        logsMap.set(log.data, log.quantidade_ml);
                    });
                }

                // If today is in this month, add real-time data if not in history
                const todayStr = now.toISOString().split('T')[0];
                if (todayConsumption > 0) {
                    // Check if today is already in logsMap with same value, if not update/set
                    // Actually history table might lack today if it's only updated at end of day or something?
                    // But we have todayConsumption from profile. Let's start with logsMap and override today if needed.
                    // The logic in stats calculation does: max(existing, todayConsumption).
                    logsMap.set(todayStr, Math.max(logsMap.get(todayStr) || 0, todayConsumption));
                }

                for (let i = 1; i <= daysInMonth; i++) {
                    const date = new Date(currentYear, currentMonth, i);
                    const dateStr = date.toISOString().split('T')[0];

                    const amount = logsMap.get(dateStr) || 0;

                    // Future days: maybe null to not draw line? Or 0?
                    // User asked for "all markings of the month", implying structure.
                    // If we use 0, the line drops to 0. If null, line breaks.
                    // Let's use 0 for past/today, and maybe null for future?
                    // "Dias" filter uses null for future hours.

                    let mlValue: number | null = amount;

                    // If date is in future, set to null?
                    const todayChecker = new Date();
                    todayChecker.setHours(0, 0, 0, 0);
                    if (date > todayChecker) {
                        mlValue = null;
                    } else {
                        // Ensure we show 0 for past days with no water
                        mlValue = amount;
                    }

                    monthlyChartData.push({
                        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        fullDate: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
                        ml: mlValue,
                        rawDate: dateStr
                    });
                }

                setGraphData(monthlyChartData);
            } else if (period === 'ano') {
                // Fetch current year aggregation (Jan-Dec)
                const currentYear = new Date().getFullYear();
                const startDate = new Date(currentYear, 0, 1); // Jan 1st
                const endDate = new Date(currentYear, 11, 31); // Dec 31st

                const { data } = await supabase
                    .from('historico_consumo_agua')
                    .select('data, quantidade_ml')
                    .eq('usuario_id', user.id)
                    .gte('data', startDate.toISOString().split('T')[0])
                    .lte('data', endDate.toISOString().split('T')[0])
                    .order('data', { ascending: true });

                // Initialize all 12 months for current year
                const monthlyData = new Map();
                for (let i = 0; i < 12; i++) {
                    const d = new Date(currentYear, i, 1);
                    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                    monthlyData.set(key, { total: 0, count: 0, rawDate: d.getTime(), monthIndex: i });
                }

                if (data) {
                    data.forEach(item => {
                        const date = new Date(item.data + 'T00:00:00');
                        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

                        if (monthlyData.has(key)) {
                            const entry = monthlyData.get(key);
                            entry.total += item.quantidade_ml;
                            entry.count += 1;
                        }
                    });
                }

                const chartData: any[] = [];
                // Sort by month index to ensure Jan-Dec order
                const sortedKeys = Array.from(monthlyData.keys()).sort((a, b) => {
                    return monthlyData.get(a).monthIndex - monthlyData.get(b).monthIndex;
                });

                sortedKeys.forEach(key => {
                    const val = monthlyData.get(key);
                    const avg = val.count > 0 ? Math.round(val.total / val.count) : 0;

                    chartData.push({
                        name: key,
                        fullDate: `Média diária em ${key}`,
                        ml: avg,
                        rawDate: val.rawDate
                    });
                });
                setGraphData(chartData);
            }
        };

        fetchGraphData();
    }, [period, history, todayConsumption, user, logsVersion]);

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
        <div className="flex flex-col min-h-screen bg-[#F0F7FA] dark:bg-background-dark text-slate-900 dark:text-white pb-32 transition-colors duration-500 overflow-x-hidden" >
            <header className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 active:scale-95 transition-all outline-none"
                        title="Ver Perfil"
                    >
                        <User className="text-blue-500" size={24} />
                    </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                    Olá, {userName || 'Atleta'}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                    Mantenha-se hidratado e acompanhe seu progresso.
                </p>
            </header>

            {/* Stat Cards Row */}
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4 cursor-grab active:cursor-grabbing" >
                {/* Card Hoje */}
                < div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5 flex flex-col justify-between" >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoje</span>
                        <div className="size-7 sm:size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Droplets className="text-blue-500" size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <p className="text-lg sm:text-xl font-black mb-1">
                            {stats.today.toLocaleString()}ml
                        </p>
                        <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold ${stats.vsOntem >= 0 ? 'text-green-500' : 'text-blue-500'}`}>
                            {stats.vsOntem >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {stats.diffLabel}
                        </div>
                    </div>
                </div >

                {/* Card Média */}
                < div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5" >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Média</span>
                        <div className="size-7 sm:size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <BarChart2 className="text-blue-500" size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.avgWeekly.toLocaleString()}ml</p>
                    <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold ${stats.avgWeekly >= goal ? 'text-green-500' : 'text-blue-500'}`}>
                        <Sparkles size={14} strokeWidth={2.5} />
                        {stats.avgWeekly >= goal ? 'Bateu' : 'Meta'}
                    </div>
                </div >

                {/* Card Sequência */}
                < div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5" >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dias</span>
                        <div className="size-7 sm:size-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <Flame className="text-orange-500" size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.streak}</p>
                    <div className="flex items-center gap-1 text-orange-500 text-[9px] sm:text-[10px] font-bold">
                        🔥 Fogo!
                    </div>
                </div >

                {/* Card Meta */}
                < div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-white/5" >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta</span>
                        <div className="size-7 sm:size-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <Target className="text-green-500" size={18} />
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.goal}ml</p>
                    <div className="flex items-center gap-1 text-slate-400 text-[9px] sm:text-[10px] font-bold">
                        🎯 Alvo
                    </div>
                </div >
            </div >

            {/* Graph Card */}
            < div className="px-4 sm:px-6 mt-6" >
                <div className="bg-white dark:bg-surface-dark rounded-[32px] p-4 sm:p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-slate-50 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <h3 className="font-black text-lg tracking-tight">Histórico de Hidratação</h3>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-full items-center w-full sm:w-auto overflow-x-auto no-scrollbar">
                            {(['dia', 'semana', 'mês', 'ano'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-black rounded-full transition-all duration-300 whitespace-nowrap ${period === p
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
                            {period === 'dia' ? (
                                <BarChart data={graphData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                        dy={10}
                                        interval={2} // Show every 2nd hour label to avoid crowding
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                        tickFormatter={(value) => `${Math.abs(value)}ml`}
                                        domain={[0, (dataMax: number) => Math.max(dataMax, 1000)]}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#3B82F6', opacity: 0.1 }} />
                                    {/* No ReferenceLine for daily discrete view because range is small */}
                                    <Bar
                                        dataKey="ml"
                                        fill="#3B82F6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            ) : (
                                <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
                                        tickFormatter={(value) => `${Math.abs(value)}ml`}
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
                            )}
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
            </div >

            {/* Quote of the day */}
            < div className="mx-6 mt-8 p-6 rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20" >
                <p className="font-bold text-sm leading-relaxed italic">
                    "A água é o combustível da vida. Mantenha seu motor rodando suavemente!"
                </p>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">💡 Dica do dia</span>
                </div>
            </div >

            <Navigation />
        </div >
    );
};

export default WaterHistory;
