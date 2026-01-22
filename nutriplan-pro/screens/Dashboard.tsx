
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_RECIPES, MOCK_USER } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    nome: string;
    avatar_url: string;
    consumo_agua_hoje: number;
    meta_agua_ml: number;
    meta_calorica_diaria: number;
  } | null>(null);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodayCalories();
      fetchUserRecipes();
    }
  }, [user]);

  const fetchTodayCalories = async () => {
    if (!user) return;

    // Get current day name in Portuguese
    const daysPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const todayName = daysPt[new Date().getDay()];

    try {
      // 1. Fetch planned meals for today
      const { data: plannedMeals, error } = await supabase
        .from('cardapio_semanal')
        .select('receita_id, tipo_refeicao')
        .eq('usuario_id', user.id)
        .eq('dia_semana', todayName);

      if (error) throw error;
      if (!plannedMeals) return;

      const enrichedMeals = [];

      // 2. Separate into Mock vs Real recipes
      // Real recipes are UUIDs (36 chars), Mock IDs are usually shorter strings
      const realRecipeIds = plannedMeals
        .map(p => p.receita_id)
        .filter(id => id && id.length > 20); // Simple UUID check

      let dbRecipes: any[] = [];

      // 3. Fetch real recipes from DB if needed
      if (realRecipeIds.length > 0) {
        const { data: recipes, error: recipesError } = await supabase
          .from('receitas')
          .select('id, nome, total_calories, imagem_url')
          .in('id', realRecipeIds);

        if (!recipesError && recipes) {
          dbRecipes = recipes;
        }
      }

      // 4. Merge data
      for (const plan of plannedMeals) {
        let recipe = MOCK_RECIPES.find(r => r.id === plan.receita_id);

        if (!recipe) {
          // Try finding in DB fetched recipes
          const dbRecipe = dbRecipes.find(r => r.id === plan.receita_id);
          if (dbRecipe) {
            recipe = {
              id: dbRecipe.id,
              name: dbRecipe.nome,
              image: dbRecipe.imagem_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', // Fallback image
              calories: dbRecipe.total_calories || 0,
              description: 'Receita personalizada',
              time: '30 min',
              category: 'Personalizada',
              difficulty: 'Médio',
              servings: 1,
              ingredients: [],
              steps: [],
              nutrition: { protein: 0, carbs: 0, fats: 0 }
            };
          }
        }

        if (recipe) {
          enrichedMeals.push({
            ...plan,
            recipe
          });
        }
      }

      setTodayMeals(enrichedMeals);

      const dailyTotal = enrichedMeals.reduce((sum, entry) => {
        return sum + (entry.recipe?.calories || 0);
      }, 0);
      setTodayCalories(dailyTotal);

    } catch (err) {
      console.error('Error fetching today menu:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('perfis_usuario')
        .select('nome, avatar_url, consumo_agua_hoje, meta_agua_ml, meta_calorica_diaria')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfile(data);
    } catch (err) {
      console.error('Error fetching dashboard profile:', err);
    }
  };

  const fetchUserRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, modo_preparo, total_calories, created_at, imagem_url')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserRecipes(data || []);
    } catch (err) {
      console.error('Error fetching user recipes:', err);
      setUserRecipes([]);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigating to recipe details

    if (!window.confirm('Tem certeza que deseja excluir esta receita?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('receitas')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      // Update local state to remove the deleted recipe
      setUserRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Erro ao excluir receita. Tente novamente.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="flex items-center justify-center rounded-full size-10 ring-2 ring-primary/20 bg-white dark:bg-surface-dark overflow-hidden">
              {profile?.avatar_url ? (
                <div
                  className="w-full h-full bg-center bg-no-repeat bg-cover"
                  style={{ backgroundImage: `url(${profile.avatar_url})` }}
                ></div>
              ) : (
                <span className="material-symbols-rounded text-slate-300 text-[24px]">person</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-primary border-2 border-background-light dark:border-background-dark"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-[#92c9a4]">Welcome back</span>
            <h2 className="text-lg font-bold leading-tight tracking-tight">
              {profile?.nome ? `${profile.nome}!` : 'Usuário!'}
            </h2>
          </div>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-white transition hover:bg-slate-300 active:scale-90"
        >
          <span className="material-symbols-rounded text-[20px]">notifications</span>
        </button>
      </header>

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Calories</p>
              <p className="text-sm font-bold">{todayCalories.toLocaleString()} <span className="text-[10px] font-normal opacity-70">/ {profile?.meta_calorica_diaria || 1800}</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((todayCalories / (profile?.meta_calorica_diaria || 1800)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Water</p>
              <p className="text-sm font-bold">{(profile?.consumo_agua_hoje || 0) / 1000}L <span className="text-[10px] font-normal opacity-70">/ {(profile?.meta_agua_ml || 2000) / 1000}L</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((profile?.consumo_agua_hoje || 0) / (profile?.meta_agua_ml || 2000)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 pt-2">
          <h2 className="text-xl font-bold tracking-tight">Menu de Hoje</h2>
          <button className="text-xs font-medium text-primary" onClick={() => navigate('/planner')}>Ver tudo</button>
        </div>
        <div className="flex overflow-x-auto no-scrollbar pb-4 pt-2 px-4 gap-3">
          {todayMeals.length > 0 ? (
            todayMeals.map((meal, index) => (
              <div
                key={`${meal.receita_id}-${index}`}
                onClick={() => navigate(`/recipe/${meal.receita_id}`)}
                className="flex flex-col gap-3 rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm min-w-[160px] w-[160px] flex-shrink-0 transition-transform active:scale-95"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${meal.recipe.image})` }}
                  ></div>
                  <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white capitalize">
                    {meal.tipo_refeicao}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug truncate">{meal.recipe.name}</p>
                  <p className="text-slate-500 dark:text-[#92c9a4] text-xs font-medium mt-0.5">{meal.recipe.calories} kcal</p>
                </div>
              </div>
            ))
          ) : (
            <div
              onClick={() => navigate('/planner')}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-dashed border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 w-full cursor-pointer hover:border-primary transition-colors"
            >
              <span className="material-symbols-rounded text-slate-400 text-[24px]">add_circle</span>
              <p className="text-sm text-slate-500 text-center font-medium">Nenhuma refeição planejada para hoje.<br /><span className="text-primary">Toque para planejar</span></p>
            </div>
          )}
        </div>
      </section>

      <div className="px-4 py-2">
        <h2 className="text-xl font-bold tracking-tight mb-3">Lista de Compras</h2>
        <div
          onClick={() => navigate('/cart')}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="p-5 flex-1 flex flex-col justify-center gap-4 z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Weekly Groceries</h3>
                  <span className="flex size-2 rounded-full bg-primary animate-pulse"></span>
                </div>
                <p className="text-slate-500 dark:text-[#92c9a4] text-sm">
                  Você tem <span className="text-primary font-bold">12 itens</span> pendentes para comprar.
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-primary h-10 px-5 text-sm font-bold text-background-dark shadow-lg shadow-primary/20">
                <span>Ver Lista</span>
                <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
              </button>
            </div>
            <div
              className="relative h-32 sm:h-auto sm:w-1/3 bg-cover bg-center"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBNp-rcyh4nX6sxrcGXBsu-ThFnB4WSAQrvzMLSSJ9Nn_Ky8fXih12OgA7r6NuQMAzYrFt_eBDu_piqtBujp3BCko7AJjYrAqWCEjcZbdI9ynhngdQg7VfeFnfq4NxRU9FTUTNXoDbEQxaC2Es-xicH0Zl7NXOu1KCgFRlsUCC1w7LSnuXD913TFtzuLkvrwjDTU6XJxAeTTnJbz8jX1vOP8XTNlzWINsJV9aStHyPx0RK4zaem-KWrRiyAtqVxiFDsdIipUuFf84c")' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-l from-white/10 to-white dark:from-surface-dark/10 dark:to-surface-dark via-transparent sm:via-transparent sm:to-90%"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 grid grid-cols-3 gap-2">
        <button onClick={() => navigate('/planner')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 active:scale-95 transition text-center">
          <div className="size-10 shrink-0 rounded-full bg-green-100 dark:bg-[#23482f] text-green-600 dark:text-primary flex items-center justify-center">
            <span className="material-symbols-rounded text-[20px]">add</span>
          </div>
          <span className="text-[11px] font-bold leading-tight">Add Refeição</span>
        </button>
        <button onClick={() => navigate('/create-recipe')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 active:scale-95 transition text-center">
          <div className="size-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <span className="material-symbols-rounded text-[20px]">menu_book</span>
          </div>
          <span className="text-[11px] font-bold leading-tight">Nova Receita</span>
        </button>
        <button onClick={() => navigate('/water-log')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 active:scale-95 transition text-center">
          <div className="size-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <span className="material-symbols-rounded text-[20px]">water_drop</span>
          </div>
          <span className="text-[11px] font-bold leading-tight">Água</span>
        </button>
      </div>

      <div className="px-4 pb-6">
        <h2 className="text-xl font-bold tracking-tight mb-3">Minhas Receitas</h2>
        <div className="flex flex-col gap-4">
          {userRecipes.length > 0 ? (
            userRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-[#23482f]/50 transition cursor-pointer"
              >
                <div className="size-20 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-primary/5 overflow-hidden flex items-center justify-center">
                  {recipe.imagem_url ? (
                    <div
                      className="w-full h-full bg-cover bg-center transition duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${recipe.imagem_url})` }}
                    ></div>
                  ) : (
                    <span className="material-symbols-rounded text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  )}
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{recipe.nome}</h4>
                    <button
                      onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Excluir receita"
                    >
                      <span className="material-symbols-rounded text-[20px]">delete</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#92c9a4] line-clamp-2 mt-1">
                    {recipe.modo_preparo ? recipe.modo_preparo.substring(0, 80) + '...' : 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-rounded text-[14px]">bolt</span> {recipe.total_calories || 0} kcal
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white dark:bg-surface-dark p-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-rounded text-slate-400 text-[48px]">menu_book</span>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhuma receita criada ainda</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Crie sua primeira receita usando o botão acima</p>
              </div>
              <button
                onClick={() => navigate('/create-recipe')}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                <span className="material-symbols-rounded text-[18px]">add</span>
                Nova Receita
              </button>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
