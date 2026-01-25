import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { MOCK_RECIPES } from '../../constants';
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

interface CalorieData {
    name: string;
    fullDate: string;
    kcal: number;
}

const CalorieHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>('semana');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [chartData, setChartData] = useState<CalorieData[]>([]);
    const [todayCalories, setTodayCalories] = useState(0);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchHistoryData();
        }
    }, [user, period]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('perfis_usuario')
                .select('*')
                .eq('id', user?.id)
                .single();
            if (data) setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchHistoryData = async () => {
        setLoading(true);
        try {
            const daysPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

            const { data: plannedMeals, error } = await supabase
                .from('cardapio_semanal')
                .select('receita_id, dia_semana')
                .eq('usuario_id', user?.id);

            if (error) throw error;

            const realRecipeIds = plannedMeals?.map(p => p.receita_id).filter(id => id && id.length > 20) || [];
            let dbRecipes: any[] = [];
            if (realRecipeIds.length > 0) {
                const { data: recipes } = await supabase
                    .from('receitas')
                    .select('id, total_calories')
                    .in('id', realRecipeIds);
                dbRecipes = recipes || [];
            }

            const dailyTotals: Record<string, number> = {};
            daysPt.forEach(day => dailyTotals[day] = 0);

            plannedMeals?.forEach(plan => {
                let calories = 0;
                const mock = MOCK_RECIPES.find(r => r.id === plan.receita_id);
                if (mock) {
                    calories = mock.calories;
                } else {
                    const db = dbRecipes.find(r => r.id === plan.receita_id);
                    calories = db?.total_calories || 0;
                }
                dailyTotals[plan.dia_semana] += calories;
            });

            const formattedData = daysPt.map(day => ({
                name: day.substring(0, 3),
                fullDate: day,
                kcal: dailyTotals[day]
            }));

            setChartData(formattedData);

            const todayName = daysPt[new Date().getDay()];
            setTodayCalories(dailyTotals[todayName] || 0);

        } catch (err) {
            console.error('Error fetching calorie history:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const goal = profile?.meta_calorica_diaria || 1800;
        const avg = chartData.length > 0 ? Math.round(chartData.reduce((acc, curr) => acc + curr.kcal, 0) / chartData.length) : 0;
        const reachedDays = chartData.filter(d => d.kcal > 0 && d.kcal <= goal + 200 && d.kcal >= goal - 200).length;

        return {
            today: todayCalories,
            goal,
            avg,
            reachedDays,
            remaining: Math.max(0, goal - todayCalories)
        };
    }, [chartData, todayCalories, profile]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{payload[0].payload.fullDate}</p>
                    <p className="text-lg font-black text-orange-500">{payload[0].value.toLocaleString()} kcal</p>
                    <div className="flex items-center gap-1 mt-1">
                        <div className={`size-1.5 rounded-full ${payload[0].value <= stats.goal + 100 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-[10px] text-slate-500">
                            {payload[0].value > stats.goal ? 'Excedeu a meta' : 'Dentro da meta'}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F5] dark:bg-background-dark text-slate-900 dark:text-white pb-32 transition-colors duration-500 overflow-x-hidden">
            <header className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="size-10 rounded-full bg-orange-500/10 flex items-center justify-center hover:bg-orange-500/20 active:scale-95 transition-all outline-none"
                    >
                        <span className="material-symbols-rounded text-orange-500 text-[24px]">person</span>
                    </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Calorias
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                    Acompanhe sua ingestão calórica semanal.
                </p>
            </header>

            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4 cursor-grab active:cursor-grabbing">
                {/* Today Card */}
                <div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-sm border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoje</span>
                        <div className="size-7 sm:size-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                            <span className="material-symbols-rounded text-[18px]">local_fire_department</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.today.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold">kcal consumidas</p>
                </div>

                {/* Remaining Card */}
                <div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-sm border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restante</span>
                        <div className="size-7 sm:size-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <span className="material-symbols-rounded text-[20px]">track_changes</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.remaining.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold">kcal para a meta</p>
                </div>

                {/* Average Card */}
                <div className="min-w-[140px] sm:min-w-[160px] flex-1 bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-sm border border-slate-50 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Média</span>
                        <div className="size-7 sm:size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-rounded text-[20px]">trending_up</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-black mb-1">{stats.avg.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold">kcal / dia</p>
                </div>
            </div>

            <div className="px-4 sm:px-6 mt-6">
                <div className="bg-white dark:bg-surface-dark rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-50 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <h3 className="font-black text-lg tracking-tight">Consumo Semanal</h3>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-full items-center">
                            <span className="material-symbols-rounded text-slate-400 text-[18px] ml-2">calendar_month</span>
                            <span className="text-[11px] font-bold px-3 text-slate-500 uppercase tracking-wider">Plano Atual</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
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
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <ReferenceLine y={stats.goal} stroke="#F97316" strokeDasharray="10 10" opacity={0.3} label={{ position: 'right', value: 'Meta', fill: '#F97316', fontSize: 10, fontWeight: 700 }} />
                                <Area
                                    type="monotone"
                                    dataKey="kcal"
                                    stroke="#F97316"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorKcal)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mx-6 mt-8 p-6 rounded-[24px] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20">
                <p className="font-bold text-sm leading-relaxed">
                    "O equilíbrio é a chave. Não conte calorias, faça as calorias contarem!"
                </p>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">💡 Insight Nutricional</span>
                </div>
            </div>

            <Navigation />
        </div>
    );
};

export default CalorieHistory;
