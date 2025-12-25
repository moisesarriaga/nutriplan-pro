
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { MOCK_RECIPES } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

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
  const [aggregatedIngredients, setAggregatedIngredients] = useState<{ id: string; name: string; unit: string; quantity: number; checked: boolean }[]>([]);

  const days = [
    { label: 'Seg', name: 'Segunda', date: '12' },
    { label: 'Ter', name: 'Terça', date: '13' },
    { label: 'Qua', name: 'Quarta', date: '14' },
    { label: 'Qui', name: 'Quinta', date: '15' },
    { label: 'Sex', name: 'Sexta', date: '16' },
    { label: 'Sáb', name: 'Sábado', date: '17' },
    { label: 'Dom', name: 'Domingo', date: '18' },
  ];

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [user]);

  const fetchMealPlan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cardapio_semanal')
      .select('*')
      .eq('usuario_id', user?.id);

    if (!error && data) {
      // Map recipes from MOCK_RECIPES for now (since DB recipes might be empty or different)
      const enrichedData = data.map(entry => ({
        ...entry,
        receita: MOCK_RECIPES.find(r => r.id === entry.receita_id)
      }));
      setMealPlan(enrichedData);
    }
    setLoading(false);
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

    const ingredientsMap = new Map<string, { id: string; name: string; unit: string; quantity: number }>();

    mealPlan.forEach(entry => {
      if (entry.receita?.ingredients) {
        entry.receita.ingredients.forEach((ing: any) => {
          if (ingredientsMap.has(ing.id)) {
            const existing = ingredientsMap.get(ing.id)!;
            ingredientsMap.set(ing.id, { ...existing, quantity: existing.quantity + ing.quantity });
          } else {
            ingredientsMap.set(ing.id, { id: ing.id, name: ing.name, unit: ing.unit, quantity: ing.quantity });
          }
        });
      }
    });

    const ingredientsList = Array.from(ingredientsMap.values()).map(ing => ({ ...ing, checked: true }));
    setAggregatedIngredients(ingredientsList);
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

    const cartItems = itemsToAdd.map(ing => ({
      usuario_id: user.id,
      nome_item: ing.name,
      ultimo_preco_informado: 0,
      unidade_preco: ing.unit,
      comprado: false
    }));

    const { error } = await supabase.from('lista_precos_mercado').upsert(cartItems, { onConflict: 'usuario_id,nome_item' });

    if (error) {
      console.error('Error generating shopping list:', error);
      alert('Erro ao gerar lista: ' + error.message);
    } else {
      alert(`${itemsToAdd.length} itens foram adicionados ao seu carrinho de compras!`);
      setIsGeneratingList(false);
      navigate('/cart');
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
          <span className="material-symbols-outlined">history</span>
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
              <span className={`text-[10px] font-semibold uppercase ${selectedDay === day.name ? '' : 'text-gray-500'}`}>{day.label}</span>
              <span className="text-sm font-bold mt-0.5">{day.date}</span>
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
                              <span className="material-symbols-outlined text-[14px]">bolt</span> {entry.receita?.calories || 0} kcal
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMeal(entry.id); }}
                          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <button
                      onClick={() => navigate('/search')}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 py-6 hover:border-primary transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">add</span>
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
            <span className="material-symbols-outlined filled">shopping_cart</span>
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
                    <span className="material-symbols-outlined absolute text-black text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
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
