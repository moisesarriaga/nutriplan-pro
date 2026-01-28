import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { MOCK_RECIPES } from '../../constants';
import { calculateServings, getCaloriesPerServing } from '../../utils/recipeHelpers';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    PieChart,
    Pie,
    Cell
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
    const [todayMacros, setTodayMacros] = useState({ protein: 0, fats: 0, carbs: 0 });
    const [todayMeals, setTodayMeals] = useState<any[]>([]);

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
                .select('receita_id, dia_semana, tipo_refeicao')
                .eq('usuario_id', user?.id);

            if (error) throw error;

            const realRecipeIds = plannedMeals?.map(p => p.receita_id).filter(id => id && id.length > 20) || [];
            let dbRecipes: any[] = [];
            if (realRecipeIds.length > 0) {
                const { data: recipes } = await supabase
                    .from('receitas')
                    .select('id, total_calories, nutritional_data, nome, imagem_url, modo_preparo')
                    .in('id', realRecipeIds);
                dbRecipes = recipes || [];
            }

            const dailyTotals: Record<string, number> = {};
            daysPt.forEach(day => dailyTotals[day] = 0);

            plannedMeals?.forEach(plan => {
                let calories = 0;
                const mock = MOCK_RECIPES.find(r => r.id === plan.receita_id);
                if (mock) {
                    calories = getCaloriesPerServing(mock.calories, mock.servings || 1);
                } else {
                    const db = dbRecipes.find(r => r.id === plan.receita_id);
                    if (db) {
                        const servings = calculateServings(db.modo_preparo || '', db.total_calories || 0);
                        calories = getCaloriesPerServing(db.total_calories || 0, servings);
                    }
                }
                dailyTotals[plan.dia_semana] += calories;
            });

            setChartData([]); // Reset to be recalculated at the end

            const todayName = daysPt[new Date().getDay()];
            setTodayCalories(dailyTotals[todayName] || 0);

            // Calculate macros only for TODAY
            const todayMeals = plannedMeals?.filter(p => p.dia_semana === todayName) || [];
            const macrosTotal = todayMeals.reduce((totals, plan) => {
                let nutrition = { protein: 0, fats: 0, carbs: 0 };
                const mock = MOCK_RECIPES.find(r => r.id === plan.receita_id);
                if (mock) {
                    nutrition = mock.nutrition;
                } else {
                    const db = dbRecipes.find(r => r.id === plan.receita_id);
                    if (db?.nutritional_data?.totalCalories) {
                        // For user recipes, we might need to derive macros if not explicit
                        // But let's assume nutrition exists or use empty
                        nutrition = db.nutritional_data.nutrition || { protein: 0, fats: 0, carbs: 0 };
                    }
                }
                return {
                    protein: totals.protein + (nutrition.protein || 0),
                    fats: totals.fats + (nutrition.fats || 0),
                    carbs: totals.carbs + (nutrition.carbs || 0)
                };
            }, { protein: 0, fats: 0, carbs: 0 });

            setTodayMacros(macrosTotal);

            // Enrich today's meals
            const enrichedToday = todayMeals.map(plan => {
                let recipe: any = MOCK_RECIPES.find(r => r.id === plan.receita_id);
                if (!recipe) {
                    const db = dbRecipes.find(r => r.id === plan.receita_id);
                    if (db) {
                        const servings = calculateServings(db.modo_preparo || '', db.total_calories || 0);
                        recipe = {
                            id: db.id,
                            name: db.nome || 'Receita Personalizada',
                            calories: getCaloriesPerServing(db.total_calories || 0, servings),
                            servings: servings,
                            image: db.imagem_url,
                            nutrition: db.nutritional_data?.nutrition || { protein: 0, fats: 0, carbs: 0 }
                        };
                        // Also normalize nutrition if available
                        if (recipe.nutrition && servings > 1) {
                            recipe.nutrition = {
                                protein: Math.round((recipe.nutrition.protein || 0) / servings),
                                fats: Math.round((recipe.nutrition.fats || 0) / servings),
                                carbs: Math.round((recipe.nutrition.carbs || 0) / servings)
                            };
                        }
                    }
                } else {
                    // Normalize Mock if needed
                    if (recipe.servings > 1) {
                        const servings = recipe.servings;
                        recipe = {
                            ...recipe,
                            calories: getCaloriesPerServing(recipe.calories, servings),
                            nutrition: {
                                protein: Math.round((recipe.nutrition?.protein || 0) / servings),
                                fats: Math.round((recipe.nutrition?.fats || 0) / servings),
                                carbs: Math.round((recipe.nutrition?.carbs || 0) / servings)
                            }
                        };
                    }
                }
                return {
                    ...plan,
                    recipe
                };
            });
            // Sort by meal type
            const mealOrder = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
            enrichedToday.sort((a, b) => mealOrder.indexOf(a.tipo_refeicao) - mealOrder.indexOf(b.tipo_refeicao));
            setTodayMeals(enrichedToday);

            // Prepare chart data based on period
            if (period === 'dia') {
                const mealData = enrichedToday.map(m => ({
                    name: m.tipo_refeicao.split(' ')[0],
                    fullDate: m.tipo_refeicao,
                    kcal: m.recipe?.calories || 0
                }));
                // If no meals, show placeholders to avoid empty chart
                if (mealData.length === 0) {
                    setChartData(mealOrder.map(m => ({ name: m.split(' ')[0], fullDate: m, kcal: 0 })));
                } else {
                    setChartData(mealData);
                }
            } else if (period === 'semana') {
                const weekData = daysPt.map(day => ({
                    name: day.substring(0, 3),
                    fullDate: day,
                    kcal: dailyTotals[day]
                }));
                setChartData(weekData);
            } else if (period === 'mês') {
                const weeklySum = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
                const monthData = [1, 2, 3, 4].map(w => ({
                    name: `Sem ${w}`,
                    fullDate: `Semana ${w}`,
                    kcal: weeklySum
                }));
                setChartData(monthData);
            } else if (period === 'ano') {
                const weeklySum = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
                const monthlySum = weeklySum * 4.3; // Average weeks in a month
                const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const yearData = monthsNames.map(m => ({
                    name: m,
                    fullDate: m,
                    kcal: Math.round(monthlySum)
                }));
                setChartData(yearData);
            }

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
    }, [chartData, todayCalories, profile, period]);

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

            {/* Nutrition Dashboard Section */}
            <div className="px-6 mt-10">
                <h3 className="font-black text-xl tracking-tight mb-5">Distribuição de Macros</h3>
                <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-50 dark:border-white/5 flex flex-col md:flex-row gap-8 items-center">
                    {/* Donut Chart Container */}
                    <div className="w-full md:w-auto flex flex-col items-center">
                        <div className="relative size-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Carb', value: Math.max(0.1, todayMacros.carbs * 4), color: '#3B82F6' },
                                            { name: 'Prot', value: Math.max(0.1, todayMacros.protein * 4), color: '#A855F7' },
                                            { name: 'Gord', value: Math.max(0.1, todayMacros.fats * 9), color: '#EF4444' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {[
                                            { color: '#3B82F6' },
                                            { color: '#A855F7' },
                                            { color: '#EF4444' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                                    {stats.today}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">KCAL</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="flex-1 w-full space-y-6">
                        {/* Carboidratos */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <span className="material-symbols-rounded text-[16px]">Bakery_Dining</span>
                                    </div>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Carboidratos</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{Math.round(todayMacros.carbs)}g</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.today > 0 ? (todayMacros.carbs * 4 / stats.today) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Proteína */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <span className="material-symbols-rounded text-[16px]">fitness_center</span>
                                    </div>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Proteína</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{Math.round(todayMacros.protein)}g</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.today > 0 ? (todayMacros.protein * 4 / stats.today) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Gorduras */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                        <span className="material-symbols-rounded text-[16px]">Opacity</span>
                                    </div>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Gorduras</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{Math.round(todayMacros.fats)}g</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-red-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.today > 0 ? (todayMacros.fats * 9 / stats.today) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 mt-6">
                <div className="bg-white dark:bg-surface-dark rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-50 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <h3 className="font-black text-lg tracking-tight">Consumo {period === 'dia' ? 'Diário' : period === 'semana' ? 'Semanal' : period === 'mês' ? 'Mensal' : 'Anual'}</h3>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-full items-center w-full sm:w-auto overflow-x-auto no-scrollbar">
                            {(['dia', 'semana', 'mês', 'ano'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-black rounded-full transition-all duration-300 whitespace-nowrap ${period === p
                                        ? 'bg-white dark:bg-surface-dark shadow-md text-slate-900 dark:text-white'
                                        : 'text-slate-400 font-bold'
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 45, left: 0, bottom: 0 }}>
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
                                {period !== 'dia' && (
                                    <ReferenceLine
                                        y={period === 'semana' ? stats.goal : period === 'mês' ? stats.goal * 7 : stats.goal * 30}
                                        stroke="#F97316"
                                        strokeDasharray="10 10"
                                        opacity={0.3}
                                        label={{
                                            position: 'top',
                                            offset: 10,
                                            value: 'META',
                                            fill: '#F97316',
                                            fontSize: 10,
                                            fontWeight: 900,
                                            className: 'tracking-tighter'
                                        }}
                                    />
                                )}
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

            {/* Meals Section */}
            <div className="px-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl tracking-tight">Refeições de Hoje</h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">Hoje</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {todayMeals.length > 0 ? todayMeals.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="bg-white dark:bg-surface-dark p-4 rounded-[24px] shadow-sm border border-slate-50 dark:border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all"
                        >
                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 overflow-hidden">
                                {item.recipe?.image ? (
                                    <img src={item.recipe.image} alt={item.recipe.name} className="size-full object-cover" />
                                ) : (
                                    <span className="material-symbols-rounded text-[24px]">restaurant</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{item.recipe?.name || 'Carregando...'}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">{item.tipo_refeicao}</span>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Consumido</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm">{item.recipe?.calories} <span className="text-[10px] font-bold text-slate-400 uppercase">kcal</span></p>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-[24px] border border-dashed border-slate-200 dark:border-white/10">
                            <span className="material-symbols-rounded text-slate-300 text-[48px] mb-2">fastfood</span>
                            <p className="text-sm text-slate-400 font-medium tracking-tight">Nenhuma refeição planejada para hoje.</p>
                        </div>
                    )}
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
