
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_RECIPES } from '../../constants';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { aggregateIngredients, AggregatedIngredient } from '../../utils/ingredientAggregator';
import { History, Zap, Trash2, Plus, ShoppingCart, Check } from 'lucide-react';

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
  const [selectedDay, setSelectedDay] = useState(['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [aggregatedIngredients, setAggregatedIngredients] = useState<AggregatedIngredient[]>([]);

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
              image: dbRecipe.imagem_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
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

  const deleteMeal = async (entryId: string) => {
    const { error } = await supabase.from('cardapio_semanal').delete().eq('id', entryId);
    if (!error) {
      setMealPlan(prev => prev.filter(e => e.id !== entryId));
    }
  };

  const openShoppingListModal = () => {
    if (mealPlan.length === 0) {
      alert('Seu cardápio está vazio. Adicione refeições antes de gerar a lista.');
      return;
    }

    // Collect ALL ingredients from ALL meals across ALL days
    const allIngredients: Array<{ name: string; quantity: number; unit: string }> = [];

    // Filter meals for the SELECTED DAY only
    const mealsForSelectedDay = mealPlan.filter(m => m.dia_semana === selectedDay);

    if (mealsForSelectedDay.length === 0) {
      alert(`Seu cardápio de ${selectedDay} está vazio. Adicione refeições para este dia antes de gerar a lista.`);
      return;
    }

    // Collect ingredients ONLY from selected day's meals
    mealsForSelectedDay.forEach(entry => {
      if (entry.receita?.ingredients) {
        entry.receita.ingredients.forEach((ing: any) => {
          allIngredients.push({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit
          });
        });
      }
    });

    // Use smart aggregation with unit conversion
    const aggregated = aggregateIngredients(allIngredients);
    setAggregatedIngredients(aggregated);
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
      alert('Nenhum item selecionado para adicionar.');
      return;
    }

    try {
      // 1. Fetch existing items in the cart to handle quantity summing
      const { data: existingItems } = await supabase
        .from('lista_precos_mercado')
        .select('*')
        .eq('usuario_id', user.id);

      const existingMap = new Map<string, any>();
      existingItems?.forEach(item => {
        existingMap.set(item.nome_item, item);
      });

      // 2. Prepare final items list (summing with existing)
      const finalItems = itemsToAdd.map(ing => {
        const existing = existingMap.get(ing.name);
        const quantity = existing
          ? Number(existing.quantidade || 0) + Number(ing.quantity)
          : Number(ing.quantity);

        return {
          usuario_id: user.id,
          nome_item: ing.name,
          quantidade: quantity,
          ultimo_preco_informado: existing ? existing.ultimo_preco_informado : 0,
          unidade_preco: ing.unit,
          comprado: existing ? existing.comprado : false
        };
      });

      const { error } = await supabase.from('lista_precos_mercado').upsert(finalItems, { onConflict: 'usuario_id,nome_item' });

      if (error) throw error;

      alert(`${itemsToAdd.length} itens foram processados e adicionados ao seu carrinho!`);
      setIsGeneratingList(false);
      navigate('/cart');
    } catch (error: any) {
      console.error('Error generating shopping list:', error);
      alert('Erro ao gerar lista: ' + error.message);
    }
  };

  const currentDayMeals = mealPlan.filter(m => m.dia_semana === selectedDay);
  const totalCalories = currentDayMeals.reduce((acc, curr) => acc + (curr.receita?.calories || 0), 0);

  return (
    <div className="flex flex-col min-h-screen pb-52">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="w-12"></div>
        <h2 className="text-lg font-bold flex-1 text-center">Cardápio Semanal</h2>
        <button className="flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <History size={24} />
        </button>
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
                        <div
                          className="w-20 h-20 shrink-0 bg-center bg-no-repeat bg-cover rounded-lg"
                          style={{ backgroundImage: `url(${entry.receita?.image || 'https://picsum.photos/200'})` }}
                        ></div>
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
                          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <button
                      onClick={() => navigate('/search')}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 py-6 hover:border-primary transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Adicionar {mealType}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pt-8">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center px-2 mb-2">
            <p className="text-sm font-medium text-gray-500">Total diário: <span className="text-slate-900 dark:text-white font-bold">{totalCalories} kcal</span></p>
            <p className="text-xs text-gray-400">Meta: 2000 kcal</p>
          </div>
          <button
            onClick={openShoppingListModal}
            className="flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl h-14 bg-primary text-black text-base font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={24} className="fill-current" />
            Gerar Lista de Compras
          </button>
        </div>
      </div>

      <Navigation />

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
    </div>
  );
};

export default MealPlanner;
