
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_RECIPES } from '../../constants';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradePrompt from '../../components/UpgradePrompt';
import { ArrowLeft, Heart, Pencil, Clock, Flame, Activity, Users, Lock, Check, ShoppingCart, Calendar, Trash2 } from 'lucide-react';
import Navigation from '../../components/Navigation';
import { useNotification } from '../../contexts/NotificationContext';

const RecipeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification, showConfirmation } = useNotification();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'prep' | 'nutrition'>('ingredients');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isAddingToPlanner, setIsAddingToPlanner] = useState(false);
  const [plannerData, setPlannerData] = useState({
    day: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()],
    mealType: 'Almoço'
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();
  const [recipe, setRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [existingGroups, setExistingGroups] = useState<{ id: string, name: string }[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const canTrackCalories = hasFeature('calorie_tracking');

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    if (!id) return;

    // First, try to find in MOCK_RECIPES
    const mockRecipe = MOCK_RECIPES.find(r => r.id === id);
    if (mockRecipe) {
      setRecipe(mockRecipe);
      setIsLoading(false);
      if (user) checkIfFavorited();
      return;
    }

    // If not found, try fetching from database
    try {
      const { data, error } = await supabase
        .from('receitas')
        .select('*, ingredientes(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Transform database recipe to match expected format
        const transformedRecipe = {
          id: data.id,
          name: data.nome,
          image: data.imagem_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
          category: 'Personalizada',
          description: data.modo_preparo?.substring(0, 100) || 'Receita personalizada',
          calories: data.total_calories || 0,
          time: '30 min', // Default value
          difficulty: 'Médio', // Default value
          servings: 2, // Default value
          ingredients: (data.ingredientes || []).map((ing: any) => ({
            id: ing.id,
            name: ing.nome,
            quantity: ing.quantidade,
            unit: ing.unidade,
            calories: ing.total_calories || 0
          })),
          steps: data.modo_preparo ? data.modo_preparo.split('\n').filter((s: string) => s.trim()) : [],
          nutrition: {
            protein: 0,
            carbs: 0,
            fats: 0
          },
          isUserRecipe: true
        };
        setRecipe(transformedRecipe);
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
    } finally {
      setIsLoading(false);
      if (user) checkIfFavorited();
    }
  };

  const checkIfFavorited = async () => {
    const { data } = await supabase
      .from('receitas_favoritas')
      .select('*')
      .eq('usuario_id', user?.id)
      .eq('receita_id', id)
      .single();
    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    if (!user || !id) return;
    if (isFavorited) {
      await supabase.from('receitas_favoritas').delete().eq('usuario_id', user.id).eq('receita_id', id);
    } else {
      await supabase.from('receitas_favoritas').insert({ usuario_id: user.id, receita_id: id });
    }
    setIsFavorited(!isFavorited);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-gray-500">Carregando receita...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <span className="material-symbols-rounded text-gray-400 text-[64px] mb-4">restaurant_menu</span>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Receita não encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 bg-primary text-black rounded-lg font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const toggleIngredient = (ingId: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingId) ? prev.filter(i => i !== ingId) : [...prev, ingId]
    );
  };

  const fetchExistingGroups = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .select('grupo_nome')
      .eq('usuario_id', user.id)
      .eq('concluido', false);

    if (error) return;

    const uniqueGroups = Array.from(new Set(data.map(item => item.grupo_nome || 'Sem Grupo')))
      .map(group => ({
        id: group,
        name: group.split(' ::: ')[0]
      }))
      .filter(group => group.id !== 'Sem Grupo')
      .sort((a, b) => a.name.localeCompare(b.name));

    setExistingGroups(uniqueGroups);
  };

  const handleAddToCartClick = () => {
    const ingredientsToCartCount = recipe.ingredients.length - selectedIngredients.length;
    if (ingredientsToCartCount === 0) {
      showNotification('Todos os itens foram marcados como "já possuo".');
      return;
    }
    fetchExistingGroups();
    setShowGroupSelector(true);
  };

  const handleAddToCart = async (targetGroupName: string | null) => {
    if (!user) return;
    setIsAddingToCart(true);

    const ingredientsToAdd = recipe.ingredients.filter(ing => !selectedIngredients.includes(ing.id));

    if (ingredientsToAdd.length === 0) {
      setIsAddingToCart(false);
      setShowGroupSelector(false);
      return;
    }

    let finalGroupName = targetGroupName;
    if (targetGroupName === 'NEW') {
      if (!newGroupName.trim()) {
        showNotification('Digite um nome para o novo grupo.');
        setIsAddingToCart(false);
        return;
      }
      finalGroupName = `${newGroupName.trim()} ::: ${Date.now()}`;
    }

    const items = ingredientsToAdd.map(ing => ({
      usuario_id: user.id,
      nome_item: ing.name,
      quantidade: parseFloat(ing.quantity) || 1,
      ultimo_preco_informado: 0,
      unidade_preco: ing.unit,
      grupo_nome: finalGroupName === 'Sem Grupo' ? null : finalGroupName,
      comprado: false,
      concluido: false
    }));

    const { error } = await supabase.from('lista_precos_mercado').insert(items);

    if (error) {
      console.error('Error adding ingredients to shopping list:', error);
      showNotification('Erro ao adicionar ingredientes: ' + error.message);
    } else {
      showNotification(`${ingredientsToAdd.length} ingredientes adicionados ao grupo "${finalGroupName?.split(' ::: ')[0] || 'Sem Grupo'}"!`);
      setSelectedIngredients([]);
      setShowGroupSelector(false);
      setNewGroupName('');
      setIsCreatingNewGroup(false);
    }
    setIsAddingToCart(false);
  };

  const handleAddToPlanner = async () => {
    if (!user || !id) return;

    // First, add the recipe to the planner
    const { error: plannerError } = await supabase.from('cardapio_semanal').insert({
      usuario_id: user.id,
      dia_semana: plannerData.day,
      tipo_refeicao: plannerData.mealType,
      receita_id: id
    });

    if (plannerError) {
      console.error('Error adding to planner:', plannerError);
      showNotification('Erro ao adicionar ao plano: ' + plannerError.message);
      return;
    }

    // Second, automatically add ingredients to cart (excluding selected ones)
    const ingredientsToCart = recipe.ingredients.filter(ing => !selectedIngredients.includes(ing.id));

    if (ingredientsToCart.length > 0) {
      const cartItems = ingredientsToCart.map(ing => ({
        usuario_id: user.id,
        nome_item: ing.name,
        ultimo_preco_informado: 0,
        unidade_preco: ing.unit,
        comprado: false // Assuming we add this column later or it defaults
      }));

      const { error: cartError } = await supabase.from('lista_precos_mercado').upsert(cartItems, { onConflict: 'usuario_id,nome_item' });

      if (cartError) {
        console.error('Error adding ingredients to cart:', cartError);
      }
    }

    showNotification(`Receita adicionada ao plano de ${plannerData.day} e ingredientes enviados ao carrinho!`);
    setIsAddingToPlanner(false);
    setSelectedIngredients([]); // Reset selection
  };

  const handleDeleteRecipe = () => {
    if (!user || !id || !recipe?.isUserRecipe) return;

    showConfirmation(
      'Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.',
      {
        title: 'Excluir Receita',
        onConfirm: async () => {
          try {
            // Delete the recipe from the database
            const { error } = await supabase
              .from('receitas')
              .delete()
              .eq('id', id)
              .eq('usuario_id', user.id);

            if (error) throw error;

            showNotification('Receita excluída com sucesso!');
            navigate('/dashboard');
          } catch (error: any) {
            console.error('Error deleting recipe:', error);

            // Check if error is due to foreign key constraint (recipe is in meal plan)
            if (error.message?.includes('foreign key constraint') ||
              error.message?.includes('cardapio_semanal')) {
              showNotification(
                'Esta receita não pode ser excluída porque está cadastrada em um cardápio semanal. Remova-a do cardápio primeiro.',
                {
                  title: 'Receita em Uso',
                  iconType: 'warning'
                }
              );
            } else {
              showNotification('Erro ao excluir receita: ' + error.message);
            }
          }
        }
      }
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-72">
      <header className="relative w-full h-[320px]">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-black/30"></div>
        </div>

        <div className="absolute top-0 left-0 w-full p-4 pt-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center size-10 rounded-full bg-background-dark/20 backdrop-blur-md border border-white/10 text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              className={`flex items-center justify-center size-10 rounded-full backdrop-blur-md border border-white/10 ${isFavorited ? 'bg-primary text-background-dark' : 'bg-background-dark/20 text-white'}`}
            >
              <Heart size={20} className={`${isFavorited ? 'fill-current' : ''}`} />
            </button>
            {recipe && recipe.isUserRecipe && (
              <>
                <button
                  onClick={() => navigate(`/create-recipe?id=${recipe.id}`)}
                  className="flex items-center justify-center size-10 rounded-full bg-background-dark/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={handleDeleteRecipe}
                  className="flex items-center justify-center size-10 rounded-full bg-background-dark/20 backdrop-blur-md border border-white/10 text-white hover:bg-red-500/80 hover:border-red-500/50 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-5 pb-6">
          <h1 className="text-3xl font-bold text-white leading-tight mb-4 drop-shadow-sm">
            {recipe.name}
          </h1>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Clock, label: recipe.time },
              { icon: Flame, label: canTrackCalories ? `${recipe.calories} kcal` : 'Premium' },
              { icon: Activity, label: recipe.difficulty },
              { icon: Users, label: `${recipe.servings} porções` }
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 bg-surface-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 ${stat.icon === Flame && !canTrackCalories ? 'cursor-pointer hover:bg-surface-dark transition-colors' : ''}`}
                onClick={stat.icon === Flame && !canTrackCalories ? () => setShowUpgradeModal(true) : undefined}
              >
                <stat.icon className="text-primary" size={18} />
                <span className="text-xs font-medium text-white">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-0 flex flex-col w-full -mt-4 bg-background-light dark:bg-background-dark rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 pt-4 pb-0">
          <div className="flex w-full" role="tablist">
            {(['ingredients', 'prep', 'nutrition'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'nutrition' && !canTrackCalories) {
                    setShowUpgradeModal(true);
                  } else {
                    setActiveTab(tab);
                  }
                }}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab ? 'text-primary border-primary' : 'text-gray-500 border-transparent'
                  }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {tab === 'nutrition' && !canTrackCalories && <Lock size={14} />}
                  {tab === 'ingredients' ? 'Ingredientes' : tab === 'prep' ? 'Preparo' : 'Nutrição'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-8">
          {activeTab === 'ingredients' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Para a Receita</h3>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">Marque o que já tem em casa</span>
              </div>
              <div className="flex flex-col gap-3">
                {recipe.ingredients.map((ing) => (
                  <label key={ing.id} className="group flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 cursor-pointer transition-all active:scale-[0.98]">
                    <div className="relative flex items-center justify-center">
                      <input
                        checked={selectedIngredients.includes(ing.id)}
                        onChange={() => toggleIngredient(ing.id)}
                        className="peer appearance-none size-6 border-2 border-gray-300 dark:border-gray-600 rounded-md checked:bg-primary checked:border-primary transition-colors"
                        type="checkbox"
                      />
                      <Check className="absolute text-background-dark opacity-0 peer-checked:opacity-100 pointer-events-none" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium transition-all ${selectedIngredients.includes(ing.id) ? 'line-through opacity-50' : ''}`}>
                        {ing.quantity}{ing.unit} {ing.name}
                      </p>
                    </div>
                  </label>
                ))}
                <button
                  onClick={handleAddToCartClick}
                  disabled={recipe.ingredients.length === selectedIngredients.length}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${recipe.ingredients.length > selectedIngredients.length ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed'}`}
                >
                  <ShoppingCart size={20} />
                  Adicionar {recipe.ingredients.length - selectedIngredients.length > 0 ? recipe.ingredients.length - selectedIngredients.length : ''} Ingredientes à Lista de Compras
                </button>
              </div>
            </section>
          )}

          {activeTab === 'prep' && (
            <section>
              <h3 className="text-lg font-bold mb-6">Modo de Preparo</h3>
              <div className="relative pl-4 space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[95%] before:w-[2px] before:bg-gray-200 dark:before:bg-white/10">
                {recipe.steps.map((step, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-[-16px] top-0 flex items-center justify-center size-7 rounded-full bg-primary text-background-dark font-bold text-xs ring-4 ring-background-light dark:ring-background-dark z-10">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'nutrition' && (
            <section>
              <h3 className="text-lg font-bold mb-4">Informação Nutricional <span className="text-xs font-normal text-gray-500 ml-2">(por porção)</span></h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Calorias', value: recipe.calories, unit: 'kcal' },
                  { label: 'Proteína', value: recipe.nutrition.protein, unit: 'g', highlight: true },
                  { label: 'Gorduras', value: recipe.nutrition.fats, unit: 'g' },
                  { label: 'Carbos', value: recipe.nutrition.carbs, unit: 'g' }
                ].map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5">
                    <span className="text-xs text-gray-500 mb-1">{stat.label}</span>
                    <span className={`text-sm font-bold ${stat.highlight ? 'text-primary' : ''}`}>{stat.value}{stat.unit}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[96px] bg-gradient-to-t from-background-light via-background-light via-60% to-transparent dark:from-background-dark dark:via-background-dark dark:via-60% pt-32 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setIsAddingToPlanner(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl h-14 bg-primary text-black text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            <Calendar size={24} />
            Adicionar ao Cardápio Semanal
          </button>
        </div>
      </div>

      {isAddingToPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-surface-dark rounded-3xl p-8 animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
            <h3 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">Planejar Refeição</h3>

            <div className="space-y-8">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block text-center">Dia da Semana</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { short: 'Seg', full: 'Segunda' },
                    { short: 'Ter', full: 'Terça' },
                    { short: 'Qua', full: 'Quarta' },
                    { short: 'Qui', full: 'Quinta' },
                    { short: 'Sex', full: 'Sexta' },
                    { short: 'Sáb', full: 'Sábado' },
                    { short: 'Dom', full: 'Domingo' }
                  ].map(day => (
                    <button
                      key={day.full}
                      onClick={() => setPlannerData(prev => ({ ...prev, day: day.full }))}
                      className={`px-3 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${plannerData.day === day.full ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:bg-white/10'}`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block text-center">Tipo de Refeição</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'].map(meal => (
                    <button
                      key={meal}
                      onClick={() => setPlannerData(prev => ({ ...prev, mealType: meal }))}
                      className={`px-4 py-4 rounded-2xl text-sm font-bold transition-all border-2 ${plannerData.mealType === meal ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setIsAddingToPlanner(false)}
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToPlanner}
                className="flex-1 h-14 rounded-2xl bg-primary text-background-dark font-bold shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-surface-dark rounded-3xl p-8 animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <h3 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Escolha a Lista</h3>
            <p className="text-sm text-center text-slate-500 mb-8">Onde você deseja adicionar os {recipe.ingredients.length - selectedIngredients.length} ingredientes faltantes?</p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-8 no-scrollbar">
              {existingGroups.length > 0 ? (
                existingGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleAddToCart(group.id)}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between"
                  >
                    <span className="font-bold">{group.name}</span>
                    <span className="material-symbols-rounded text-primary">chevron_right</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <span className="material-symbols-rounded text-[48px] mb-2 block opacity-30">shopping_bag</span>
                  <p className="text-sm">Você ainda não possui grupos de lista.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {isCreatingNewGroup ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-200">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nome do novo grupo (ex: Mercado Mensal)"
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 focus:border-primary outline-none font-bold"
                    autoFocus
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCreatingNewGroup(false)}
                      className="flex-1 h-12 rounded-xl font-bold text-slate-500"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => handleAddToCart('NEW')}
                      disabled={isAddingToCart || !newGroupName.trim()}
                      className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20"
                    >
                      {isAddingToCart ? 'Adicionando...' : 'Criar e Adicionar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsCreatingNewGroup(true)}
                    className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold hover:bg-primary/5 transition-all"
                  >
                    + Criar Novo Grupo de Lista
                  </button>
                  <button
                    onClick={() => setShowGroupSelector(false)}
                    className="w-full h-12 rounded-xl text-slate-400 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="O Controle de Calorias e informações nutricionais completas"
          requiredPlan="simple"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
      <Navigation />
    </div>
  );
};

export default RecipeDetails;
