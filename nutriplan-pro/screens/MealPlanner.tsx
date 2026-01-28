
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_RECIPES } from '../../constants';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { aggregateIngredients, AggregatedIngredient } from '../../utils/ingredientAggregator';
import { History, Zap, Trash2, Plus, ShoppingCart, Check } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface MealPlanEntry {
  id: string;
  dia_semana: string;
  tipo_refeicao: string;
  receita_id: string;
  receita?: any;
}

const MealPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [selectedDay, setSelectedDay] = useState(['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);
  const [showGroupNamePrompt, setShowGroupNamePrompt] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [aggregatedIngredients, setAggregatedIngredients] = useState<AggregatedIngredient[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [mealTypeToAdd, setMealTypeToAdd] = useState('');
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [allSelectableRecipes, setAllSelectableRecipes] = useState<any[]>([]);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<any | null>(null);

  const days = [
    { label: 'Seg', name: 'Segunda' },
    { label: 'Ter', name: 'Terça' },
    { label: 'Qua', name: 'Quarta' },
    { label: 'Qui', name: 'Quinta' },
    { label: 'Sex', name: 'Sexta' },
    { label: 'Sáb', name: 'Sábado' },
    { label: 'Dom', name: 'Domingo' },
  ];

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [user]);

  const fetchMealPlan = async () => {
    setLoading(true);
    try {
      // 1. Fetch meal plan entries
      const { data: entries, error: entriesError } = await supabase
        .from('cardapio_semanal')
        .select('*')
        .eq('usuario_id', user?.id);

      if (entriesError) throw entriesError;

      // 2. Separate Mock vs Real IDs
      const recipeIds = Array.from(new Set(entries.map(e => e.receita_id)));

      const realRecipeIds = recipeIds.filter(id => id && id.length > 20); // Assumption: UUIDs are long strings

      let dbRecipes: any[] = [];

      // 3. Fetch real recipes from database
      if (realRecipeIds.length > 0) {
        const { data: recipes, error: recipesError } = await supabase
          .from('receitas')
          .select('id, nome, total_calories, imagem_url, modo_preparo, nutritional_data')
          .in('id', realRecipeIds);

        if (!recipesError && recipes) {
          dbRecipes = recipes;
        }
      }

      // 4. Enrich entries with recipe data (check DB first, then MOCKS)
      const enrichedData = entries.map(entry => {
        // Check DB first (User recipes)
        const dbRecipe = dbRecipes.find(r => r.id === entry.receita_id);

        if (dbRecipe) {
          return {
            ...entry,
            receita: {
              id: dbRecipe.id,
              name: dbRecipe.nome,
              image: dbRecipe.imagem_url || null,
              calories: dbRecipe.total_calories || 0,
              description: 'Receita personalizada',
              time: '30 min',
              category: 'Personalizada',
              difficulty: 'Médio',
              servings: 1,
              ingredients: dbRecipe.nutritional_data?.ingredients || [],
              steps: [],
              nutrition: { protein: 0, carbs: 0, fats: 0 }
            }
          };
        }

        // Fallback to MOCK_RECIPES
        const mockRecipe = MOCK_RECIPES.find(r => r.id === entry.receita_id);

        return {
          ...entry,
          receita: mockRecipe || null
        };
      });

      setMealPlan(enrichedData);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectableRecipes = async () => {
    if (!user) return;
    try {
      // Combinar Mock + DB
      const { data: dbRecipes, error } = await supabase
        .from('receitas')
        .select('id, nome, total_calories, imagem_url, nutritional_data')
        .eq('usuario_id', user.id);

      const formattedDb = (dbRecipes || []).map(r => ({
        id: r.id,
        name: r.nome,
        image: r.imagem_url || null,
        calories: r.total_calories || 0,
        isCustom: true,
        ingredients: r.nutritional_data?.ingredients || []
      }));

      const formattedMock = MOCK_RECIPES.map(r => ({
        id: r.id,
        name: r.name,
        image: r.image,
        calories: r.calories,
        isCustom: false,
        ingredients: r.ingredients || []
      }));

      setAllSelectableRecipes([...formattedDb, ...formattedMock]);
    } catch (err) {
      console.error('Error fetching selectable recipes:', err);
    }
  };

  const addMealToPlan = async (recipe: any) => {
    if (!user || isAddingMeal) return;
    setIsAddingMeal(true);

    try {
      const { data, error } = await supabase
        .from('cardapio_semanal')
        .insert({
          usuario_id: user.id,
          dia_semana: selectedDay,
          tipo_refeicao: mealTypeToAdd,
          receita_id: recipe.id
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      const newEntry = {
        ...data,
        receita: {
          id: recipe.id,
          name: recipe.name,
          image: recipe.image,
          calories: recipe.calories
        }
      };

      setMealPlan(prev => [...prev, newEntry]);
      showNotification(`${recipe.name} adicionada ao ${mealTypeToAdd}!`, { iconType: 'success' });
      setShowRecipeSelector(false);
      setRecipeSearchTerm('');
    } catch (err) {
      console.error('Error adding meal:', err);
      showNotification('Erro ao adicionar receita. Tente novamente.', { iconType: 'error' });
    } finally {
      setIsAddingMeal(false);
    }
  };

  const deleteMeal = async (entryId: string) => {
    const { error } = await supabase.from('cardapio_semanal').delete().eq('id', entryId);
    if (!error) {
      setMealPlan(prev => prev.filter(e => e.id !== entryId));
    }
  };

  const openShoppingListModal = () => {
    if (mealPlan.length === 0) {
      showNotification('Seu cardápio está vazio. Adicione refeições antes de gerar a lista.');
      return;
    }
    setShowGenerateOptions(true);
  };

  const handleGenerateList = (period: 'daily' | 'weekly' | 'monthly') => {
    // Save period and show group name prompt
    setSelectedPeriod(period);
    setShowGenerateOptions(false);
    setShowGroupNamePrompt(true);
  };

  const confirmGroupNameAndGenerate = async () => {
    if (!groupName.trim()) {
      showNotification('Por favor, informe um nome para o grupo.');
      return;
    }

    const { data: existingRecords, error } = await supabase
      .from('lista_precos_mercado')
      .select('grupo_nome')
      .eq('usuario_id', user?.id)
      .eq('concluido', false) // Somente listas ativas
      .ilike('grupo_nome', `${groupName.trim()} ::: %`)
      .limit(1);

    if (existingRecords && existingRecords.length > 0) {
      setShowDuplicateConfirm(true);
      return;
    }

    // If no duplicate, proceed to generation
    generateIngredients();
  };

  const generateIngredients = () => {
    // Collect ingredients based on saved period
    const allIngredients: Array<{ name: string; quantity: number; unit: string }> = [];
    let mealsToProcess: MealPlanEntry[] = [];
    let multiplier = 1;

    if (selectedPeriod === 'daily') {
      mealsToProcess = mealPlan.filter(m => m.dia_semana === selectedDay);
      if (mealsToProcess.length === 0) {
        showNotification(`Seu cardápio de ${selectedDay} está vazio.`);
        setShowGroupNamePrompt(false);
        setShowDuplicateConfirm(false);
        return;
      }
    } else if (selectedPeriod === 'weekly') {
      mealsToProcess = mealPlan;
    } else if (selectedPeriod === 'monthly') {
      mealsToProcess = mealPlan;
      multiplier = 4;
    }

    if (mealsToProcess.length === 0) {
      showNotification('Nenhuma refeição encontrada para o período selecionado.');
      setShowGroupNamePrompt(false);
      setShowDuplicateConfirm(false);
      return;
    }

    mealsToProcess.forEach(entry => {
      if (entry.receita?.ingredients) {
        entry.receita.ingredients.forEach((ing: any) => {
          allIngredients.push({
            name: ing.name,
            quantity: Number(ing.quantity) * multiplier,
            unit: ing.unit
          });
        });
      }
    });

    const aggregated = aggregateIngredients(allIngredients);
    setAggregatedIngredients(aggregated);
    setShowGroupNamePrompt(false);
    setShowDuplicateConfirm(false);
    setIsGeneratingList(true);
  };

  const toggleIngredientCheck = (id: string) => {
    setAggregatedIngredients(prev => prev.map(ing =>
      ing.id === id ? { ...ing, checked: !ing.checked } : ing
    ));
  };

  const confirmShoppingList = async () => {
    if (!user) return;

    const itemsToAdd = aggregatedIngredients.filter(ing => ing.checked);

    if (itemsToAdd.length === 0) {
      showNotification('Nenhum item selecionado para adicionar.');
      return;
    }

    try {
      // Create unique group name with timestamp
      // Create unique group name with full timestamp (including ms) to prevent any grouping
      const now = new Date();
      const uniqueSuffix = now.getTime(); // Use Unix timestamp for internal uniqueness
      const uniqueGroupName = `${groupName.trim()} ::: ${uniqueSuffix}`;

      // Prepare final items list (always create new items)
      const finalItems = itemsToAdd.map(ing => {
        return {
          usuario_id: user.id,
          nome_item: ing.name,
          quantidade: Number(ing.quantity),
          ultimo_preco_informado: 0,
          unidade_preco: ing.unit,
          comprado: false,
          grupo_nome: uniqueGroupName, // Use unique group name with timestamp
          concluido: false // Ensure it starts as active
        };
      });

      const { error } = await supabase.from('lista_precos_mercado').insert(finalItems);

      if (error) throw error;

      showNotification(`${itemsToAdd.length} itens foram processados e adicionados ao seu carrinho!`);
      setIsGeneratingList(false);
      navigate('/cart');
    } catch (error: any) {
      console.error('Error generating shopping list:', error);
      showNotification('Erro ao gerar lista: ' + error.message);
    }
  };

  const currentDayMeals = mealPlan.filter(m => m.dia_semana === selectedDay);
  const totalCalories = currentDayMeals.reduce((acc, curr) => acc + (curr.receita?.calories || 0), 0);

  return (
    <div className="flex flex-col min-h-screen pb-72">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="w-12"></div>
        <h2 className="text-lg font-bold flex-1 text-center">Cardápio Semanal</h2>
        <div className="w-12"></div>
      </header>

      <div className="sticky top-[60px] z-10 bg-background-light dark:bg-background-dark py-3 pl-4 border-b border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pr-4">
          {days.map((day) => (
            <button
              key={day.name}
              onClick={() => setSelectedDay(day.name)}
              className={`flex h-12 shrink-0 min-w-[4.5rem] flex-col items-center justify-center rounded-xl transition-all ${selectedDay === day.name
                ? 'bg-primary shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-1 dark:ring-offset-background-dark text-black'
                : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700'
                }`}
            >
              <span className={`text-sm font-bold ${selectedDay === day.name ? '' : 'text-gray-500'}`}>{day.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 pt-2">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Carregando cardápio...</div>
        ) : (
          ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'].map((mealType) => {
            const meals = currentDayMeals.filter(m => m.tipo_refeicao === mealType);

            return (
              <div key={mealType}>
                <div className="flex items-center justify-between pt-4 pb-2 px-1">
                  <h3 className="text-lg font-bold">{mealType}</h3>
                  <span className="text-xs font-medium text-gray-500">
                    {meals.reduce((sum, m) => sum + (m.receita?.calories || 0), 0)} kcal
                  </span>
                </div>

                <div className="space-y-3">
                  {meals.length > 0 ? (
                    meals.map((entry) => (
                      <div key={entry.id} className="group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-surface-dark p-3 shadow-sm border border-transparent hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/recipe/${entry.receita_id}`)}>
                        <div className="w-20 h-20 shrink-0 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                          {entry.receita?.image ? (
                            <img
                              src={entry.receita.image}
                              alt={entry.receita.name || 'Receita'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 text-[32px]">restaurant_menu</span>
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                          <p className="text-base font-bold leading-tight truncate">{entry.receita?.name || 'Receita Desconhecida'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <Zap size={14} className="fill-current" /> {entry.receita?.calories || 0} kcal
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMeal(entry.id); }}
                          className="p-1 px-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  ) : null}

                  {/* Always show Add button if less than 5 recipes (flexible plan) */}
                  {meals.length < 5 && (
                    <button
                      onClick={() => {
                        setMealTypeToAdd(mealType);
                        setShowRecipeSelector(true);
                        fetchSelectableRecipes();
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 hover:border-primary transition-all group ${meals.length > 0 ? 'py-3' : 'py-6'}`}
                    >
                      <div className={`flex items-center justify-center rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform ${meals.length > 0 ? 'h-6 w-6' : 'h-8 w-8'}`}>
                        <Plus size={meals.length > 0 ? 16 : 20} />
                      </div>
                      <span className={`${meals.length > 0 ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                        Adicionar {meals.length > 0 ? 'mais' : mealType}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[96px] bg-gradient-to-t from-background-light via-background-light via-60% to-transparent dark:from-background-dark dark:via-background-dark dark:via-60% pt-32 px-4">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center px-2 mb-1">
            <p className="text-sm font-medium text-gray-500">Total diário: <span className="text-slate-900 dark:text-white font-bold">{totalCalories} kcal</span></p>
            <p className="text-xs text-gray-400">Meta: 2000 kcal</p>
          </div>
          <button
            onClick={openShoppingListModal}
            className="flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl h-14 bg-primary text-black text-base font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={24} />
            Gerar Lista de Compras
          </button>
        </div>
      </div>

      <Navigation />

      {/* Modal de Seleção de Período */}
      {showGenerateOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-center">Gerar Lista de Compras</h3>
            <p className="text-sm text-center text-slate-500 mb-6">Selecione o período para gerar sua lista:</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleGenerateList('daily')}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-rounded">calendar_today</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Diária ({selectedDay})</span>
                  <span className="text-xs text-slate-500">Apenas refeições de hoje</span>
                </div>
              </button>

              <button
                onClick={() => handleGenerateList('weekly')}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-rounded">date_range</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Semanal (7 dias)</span>
                  <span className="text-xs text-slate-500">Todo o cardápio da semana</span>
                </div>
              </button>

              <button
                onClick={() => handleGenerateList('monthly')}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-rounded">calendar_month</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Mensal (4 semanas)</span>
                  <span className="text-xs text-slate-500">Quantidade semanal x 4</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowGenerateOptions(false)}
              className="mt-6 w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Nome do Grupo */}
      {showGroupNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-center">Nome do Grupo</h3>
            <p className="text-sm text-center text-slate-500 mb-6">Dê um nome para esta lista de compras:</p>

            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmGroupNameAndGenerate()}
              placeholder="Ex: Feira Semanal, Churrasco..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowGroupNamePrompt(false); setGroupName(''); }}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmGroupNameAndGenerate}
                disabled={!groupName.trim()}
                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Nome Duplicado */}
      {showDuplicateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <span className="material-symbols-rounded text-[32px]">warning</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Nome já existe</h3>
              <p className="text-sm text-slate-500 mb-6 px-2">
                Já existe um grupo chamado "<span className="font-bold text-slate-800 dark:text-white">{groupName}</span>". Deseja criar outro grupo com o mesmo nome?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateConfirm(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-slate-800"
              >
                Não
              </button>
              <button
                onClick={generateIngredients}
                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {isGeneratingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-1 text-center">Gerar Lista de Compras</h3>
            <p className="text-sm text-center text-slate-500 mb-6">Desmarque os itens que você <span className="font-bold text-slate-700 dark:text-slate-300">já tem em casa</span>.</p>

            <div className="flex justify-end gap-2 mb-2 px-2">
              <button
                onClick={() => setAggregatedIngredients(prev => prev.map(i => ({ ...i, checked: true })))}
                className="text-xs font-bold text-primary hover:underline"
              >
                Marcar Todos
              </button>
              <button
                onClick={() => setAggregatedIngredients(prev => prev.map(i => ({ ...i, checked: false })))}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline"
              >
                Desmarcar Todos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-6 overscroll-contain">
              {aggregatedIngredients.map(ing => (
                <label key={ing.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${ing.checked ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 dark:bg-white/5 border-transparent opacity-60'}`}>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={ing.checked}
                      onChange={() => toggleIngredientCheck(ing.id)}
                      className="peer appearance-none size-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-primary checked:border-primary transition-colors"
                    />
                    <Check className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${!ing.checked && 'line-through text-slate-400'}`}>{ing.name}</p>
                    <p className="text-xs text-slate-500">{ing.quantity} {ing.unit}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setIsGeneratingList(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmShoppingList}
                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Adicionar {aggregatedIngredients.filter(i => i.checked).length} Itens
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Seleção de Receita */}
      {showRecipeSelector && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface-dark rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden"></div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Adicionar {mealTypeToAdd}</h3>
              <button
                onClick={() => { setShowRecipeSelector(false); setRecipeSearchTerm(''); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <span className="material-symbols-rounded">search</span>
              </span>
              <input
                type="text"
                placeholder="Buscar receitas..."
                value={recipeSearchTerm}
                onChange={(e) => setRecipeSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl py-3.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                autoFocus={window.innerWidth >= 640}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar pb-10">
              {/* Minhas Receitas Section */}
              {allSelectableRecipes.filter(r => r.isCustom && r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase())).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Minhas Receitas</h4>
                  <div className="space-y-3">
                    {allSelectableRecipes
                      .filter(r => r.isCustom && r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()))
                      .map((recipe) => (
                        <div
                          key={recipe.id}
                          onClick={() => addMealToPlan(recipe)}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98]"
                        >
                          {recipe.image ? (
                            <div
                              className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                              style={{ backgroundImage: `url(${recipe.image})` }}
                            ></div>
                          ) : (
                            <div className="size-16 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                              <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 text-[24px]">restaurant_menu</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{recipe.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-primary font-bold text-xs flex items-center gap-0.5">
                                <Zap size={10} className="fill-current" /> {recipe.calories} kcal
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewRecipe(recipe); }}
                              className="size-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
                              title="Ver Detalhes"
                            >
                              <span className="material-symbols-rounded text-[20px]">visibility</span>
                            </button>
                            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                              <Plus size={20} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Populares Section */}
              {allSelectableRecipes.filter(r => !r.isCustom && r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase())).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Populares esta semana</h4>
                  <div className="space-y-3">
                    {allSelectableRecipes
                      .filter(r => !r.isCustom && r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()))
                      .map((recipe) => (
                        <div
                          key={recipe.id}
                          onClick={() => addMealToPlan(recipe)}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98]"
                        >
                          {recipe.image ? (
                            <div
                              className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                              style={{ backgroundImage: `url(${recipe.image})` }}
                            ></div>
                          ) : (
                            <div className="size-16 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                              <span className="material-symbols-rounded text-slate-300 dark:text-slate-700 text-[24px]">restaurant_menu</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{recipe.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-primary font-bold text-xs flex items-center gap-0.5">
                                <Zap size={10} className="fill-current" /> {recipe.calories} kcal
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewRecipe(recipe); }}
                              className="size-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
                              title="Ver Detalhes"
                            >
                              <span className="material-symbols-rounded text-[20px]">visibility</span>
                            </button>
                            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                              <Plus size={20} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {allSelectableRecipes.length > 0 &&
                allSelectableRecipes.filter(r => r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase())).length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 text-sm">Nenhuma receita encontrada.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Detalhes da Receita (Preview) */}
      {previewRecipe && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
            <div
              className={`h-48 w-full bg-center bg-cover relative ${!previewRecipe.image && 'bg-surface-dark'}`}
              style={previewRecipe.image ? { backgroundImage: `url(${previewRecipe.image})` } : {}}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <button
                onClick={() => setPreviewRecipe(null)}
                className="absolute top-4 right-4 size-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
              <div className="absolute bottom-4 left-6 pr-6">
                <h3 className="text-xl font-bold text-white leading-tight mb-1">{previewRecipe.name}</h3>
                <p className="text-primary font-bold text-sm flex items-center gap-1">
                  <Zap size={14} className="fill-current" /> {previewRecipe.calories} kcal
                </p>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ingredientes Necessários</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                {previewRecipe.ingredients && previewRecipe.ingredients.length > 0 ? (
                  previewRecipe.ingredients.map((ing: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ing.name}</span>
                      <span className="text-xs font-bold text-primary">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-500 italic">Ingredientes não informados.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  addMealToPlan(previewRecipe);
                  setPreviewRecipe(null);
                }}
                className="w-full mt-8 h-14 rounded-2xl bg-primary text-black font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.95] transition-all"
              >
                <Plus size={20} />
                Adicionar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
