
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_RECIPES, MOCK_USER } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTutorial } from '../../contexts/TutorialContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showConfirmation, showNotification } = useNotification();
  const { startTutorial } = useTutorial();
  const [profile, setProfile] = useState<{
    nome: string;
    avatar_url: string;
    consumo_agua_hoje: number;
    meta_agua_ml: number;
    meta_calorica_diaria: number;
    tutorial_visto?: boolean;
  } | null>(null);

  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [shoppingListGroups, setShoppingListGroups] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodayCalories();
      fetchUserRecipes();
      fetchShoppingListGroups();

      const storageKey = `welcome_shown_${user.id}`;
      const hasBeenWelcomed = localStorage.getItem(storageKey);

      if (!hasBeenWelcomed) {
        setWelcomeMessage(t('dashboard.welcome'));
        localStorage.setItem(storageKey, 'true');
      } else {
        setWelcomeMessage(t('dashboard.welcomeBack'));
      }

      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 7000);

      // Real-time subscription for profile updates (water consumption)
      const profileSubscription = supabase
        .channel('dashboard_profile_changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'perfis_usuario',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          const updatedProfile = payload.new;
          console.log('[Dashboard] Real-time profile update:', { consumo_agua_hoje: updatedProfile.consumo_agua_hoje });
          setProfile(prev => prev ? {
            ...prev,
            consumo_agua_hoje: updatedProfile.consumo_agua_hoje || 0,
            meta_agua_ml: updatedProfile.meta_agua_ml || prev.meta_agua_ml,
            meta_calorica_diaria: updatedProfile.meta_calorica_diaria || prev.meta_calorica_diaria
          } : null);
        })
        .subscribe();

      return () => {
        clearTimeout(timer);
        supabase.removeChannel(profileSubscription);
      };
    }
  }, [user, t]);

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
              image: dbRecipe.imagem_url || null,
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

      // 5. Sort meals logically: Café da Manhã, Almoço, Jantar, Lanche
      const mealOrder = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
      enrichedMeals.sort((a, b) => {
        return mealOrder.indexOf(a.tipo_refeicao) - mealOrder.indexOf(b.tipo_refeicao);
      });

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
        .select('nome, avatar_url, consumo_agua_hoje, meta_agua_ml, meta_calorica_diaria, tutorial_visto')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        console.log('[Dashboard] Profile fetched:', { consumo_agua_hoje: data.consumo_agua_hoje, meta_agua_ml: data.meta_agua_ml });
        setProfile(data);

        // Auto-trigger tutorial if not seen
        if (data.tutorial_visto === false || data.tutorial_visto === null) {
          // Delay slightly to allow layout to settle
          setTimeout(() => {
            startTutorial();
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard profile:', err);
    }
  };

  const fetchUserRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, modo_preparo, total_calories, created_at, imagem_url, tempo_preparo')
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

  const fetchShoppingListGroups = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lista_precos_mercado')
        .select('grupo_nome')
        .eq('usuario_id', user.id)
        .eq('concluido', false);
      if (error) throw error;
      if (data) {
        const uniqueGroups = new Set(data.map(item => item.grupo_nome));
        setShoppingListGroups(uniqueGroups.size);
      }
    } catch (err) {
      console.error('Error fetching shopping list groups:', err);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigating to recipe details

    showConfirmation('Tem certeza que deseja excluir esta receita?', {
      title: 'Excluir Receita',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('receitas')
            .delete()
            .eq('id', recipeId);

          if (error) throw error;

          // Update local state to remove the deleted recipe
          setUserRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));

          showNotification('Receita excluída com sucesso!', {
            title: 'Excluído!'
          });
        } catch (err: any) {
          console.error('Error deleting recipe:', err);

          // Check if error is due to foreign key constraint (recipe is in meal plan)
          if (err.message?.includes('foreign key constraint') ||
            err.message?.includes('cardapio_semanal')) {
            showNotification(
              'Esta receita não pode ser excluída porque está cadastrada em um cardápio semanal. Remova-a do cardápio primeiro.',
              {
                title: 'Receita em Uso',
                iconType: 'warning'
              }
            );
          } else {
            showNotification('Erro ao excluir receita. Tente novamente.', {
              title: 'Erro'
            });
          }
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-52 relative w-full">
      <header id="dashboard-header" className="sticky top-0 z-20 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="flex items-center justify-center rounded-full size-10 ring-2 ring-primary/20 bg-white dark:bg-surface-dark overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="material-symbols-rounded text-slate-300 text-[24px]">person</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-primary border-2 border-background-light dark:border-background-dark"></div>
          </div>
          <div className="flex flex-col">
            <div className={`overflow-hidden transition-all duration-700 ${showWelcome ? 'max-h-5 opacity-100' : 'max-h-0 opacity-0'}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-[#92c9a4]">
                {welcomeMessage}
              </span>
            </div>
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

      <div id="health-summary" className="px-4 py-4 grid grid-cols-2 gap-3">
        <div
          onClick={() => navigate('/calorie-history')}
          className="rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all hover:border-primary/30 border border-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
              <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'wght' 600" }}>local_fire_department</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Calories</p>
              <p className="text-sm font-bold">{todayCalories.toLocaleString()} <span className="text-[10px] font-normal opacity-70">/ {profile?.meta_calorica_diaria || 1800}</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((todayCalories / (profile?.meta_calorica_diaria || 1800)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div
          onClick={() => navigate('/water-log')}
          className="rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all hover:border-primary/30 border border-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'wght' 600" }}>water_drop</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Water</p>
              <p className="text-sm font-bold">{(profile?.consumo_agua_hoje || 0) / 1000}L <span className="text-[10px] font-normal opacity-70">/ {(profile?.meta_agua_ml || 2000) / 1000}L</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden mt-1">
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
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  {meal.recipe.image ? (
                    <img
                      src={meal.recipe.image}
                      alt={meal.recipe.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 text-[40px]">restaurant_menu</span>
                  )}
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
                <p className="text-slate-500 dark:text-[#92c9a4] text-sm">
                  {shoppingListGroups === 0 ? (
                    'Sua lista de compras está vazia.'
                  ) : (
                    <>Você tem <span className="text-primary font-bold">{shoppingListGroups} {shoppingListGroups === 1 ? 'grupo' : 'grupos'}</span> de compras pendentes.</>
                  )}
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-primary h-10 px-5 text-sm font-bold text-background-dark shadow-lg shadow-primary/20">
                <span>Ver Lista</span>
                <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
              </button>
            </div>
            <div className="relative h-32 sm:h-auto sm:w-1/3 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNp-rcyh4nX6sxrcGXBsu-ThFnB4WSAQrvzMLSSJ9Nn_Ky8fXih12OgA7r6NuQMAzYrFt_eBDu_piqtBujp3BCko7AJjYrAqWCEjcZbdI9ynhngdQg7VfeFnfq4NxRU9FTUTNXoDbEQxaC2Es-xicH0Zl7NXOu1KCgFRlsUCC1w7LSnuXD913TFtzuLkvrwjDTU6XJxAeTTnJbz8jX1vOP8XTNlzWINsJV9aStHyPx0RK4zaem-KWrRiyAtqVxiFDsdIipUuFf84c"
                alt="Shopping List"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-l from-white/10 to-white dark:from-surface-dark/10 dark:to-surface-dark via-transparent sm:via-transparent sm:to-90%"></div>
            </div>
          </div>
        </div>
      </div>



      <div className="px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Minhas Receitas</h2>
          <button onClick={() => navigate('/my-recipes')} className="text-xs font-medium text-primary active:opacity-70 transition-opacity">
            Gerenciar
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {userRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-[#23482f]/50 transition cursor-pointer border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <div className="size-20 shrink-0 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                {recipe.imagem_url ? (
                  <img
                    src={recipe.imagem_url}
                    alt={recipe.nome}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 text-[40px]">restaurant_menu</span>
                )}
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm truncate">{recipe.nome}</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/create-recipe?id=${recipe.id}`);
                      }}
                      className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
                      title="Editar receita"
                    >
                      <span className="material-symbols-rounded text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Excluir receita"
                    >
                      <span className="material-symbols-rounded text-[20px]">delete</span>
                    </button>
                  </div>
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
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[96px] bg-gradient-to-t from-background-light via-background-light via-60% to-transparent dark:from-background-dark dark:via-background-dark dark:via-60% pt-32 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/create-recipe')}
            className="flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl h-14 bg-primary text-black text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            title="Nova Receita"
          >
            <Plus size={24} />
            Nova Receita
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
