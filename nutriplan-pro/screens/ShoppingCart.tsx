
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_RECIPES } from '../../constants';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradePrompt from '../../components/UpgradePrompt';
import { ArrowLeft, MoreHorizontal, Plus, Lock, ShoppingBasket, Package, Check, Trash2, ArrowRight } from 'lucide-react';

interface ShoppingItem {
  usuario_id: string;
  nome_item: string;
  quantidade: number;
  ultimo_preco_informado: number;
  unidade_preco: string;
  comprado?: boolean;
}

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature } = useSubscription();

  const canSumPrices = hasFeature('price_sum');

  // Efeito para travar o scroll da página de fundo quando o modal de upgrade estiver aberto
  useEffect(() => {
    if (showUpgradeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showUpgradeModal]);

  useEffect(() => {
    if (user) {
      fetchItems().then(() => {
        syncWithMealPlan();
      });
    }
  }, [user]);

  const syncWithMealPlan = async () => {
    if (!user) return;

    // 1. Get current cart items (names) to avoid duplicates
    const { data: currentCart } = await supabase
      .from('lista_precos_mercado')
      .select('nome_item')
      .eq('usuario_id', user.id);

    const existingNames = new Set(currentCart?.map(i => i.nome_item) || []);

    // 2. Fetch Meal Plan
    const { data: mealPlan } = await supabase
      .from('cardapio_semanal')
      .select('receita_id')
      .eq('usuario_id', user.id);

    if (!mealPlan || mealPlan.length === 0) return;

    // 3. Extract unique ingredients from planned recipes
    const ingredientsToAdd = new Map<string, { name: string; unit: string }>();

    mealPlan.forEach(entry => {
      const recipe = MOCK_RECIPES.find(r => r.id === entry.receita_id);
      if (recipe?.ingredients) {
        recipe.ingredients.forEach(ing => {
          if (!existingNames.has(ing.name)) {
            ingredientsToAdd.set(ing.name, { name: ing.name, unit: ing.unit });
          }
        });
      }
    });

    if (ingredientsToAdd.size === 0) return;

    // 4. Insert new items
    const newItems = Array.from(ingredientsToAdd.values()).map(ing => ({
      usuario_id: user.id,
      nome_item: ing.name,
      quantidade: 1, // Default or extracted
      ultimo_preco_informado: 0,
      unidade_preco: ing.unit,
      comprado: false
    }));

    const { error } = await supabase.from('lista_precos_mercado').insert(newItems);

    if (!error) {
      fetchItems(); // Refresh list
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .select('*')
      .eq('usuario_id', user?.id);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (nomeItem: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('lista_precos_mercado')
      .delete()
      .eq('usuario_id', user.id)
      .eq('nome_item', nomeItem);

    if (!error) {
      setItems(prev => prev.filter(i => i.nome_item !== nomeItem));
    }
  };

  const addItem = async () => {
    if (!user || !newItemName.trim()) return;
    setIsAdding(true);
    const newItem: Partial<ShoppingItem> = {
      usuario_id: user.id,
      nome_item: newItemName,
      quantidade: 1,
      ultimo_preco_informado: 0,
      unidade_preco: 'un'
    };

    const { error } = await supabase.from('lista_precos_mercado').upsert(newItem, { onConflict: 'usuario_id,nome_item' });

    if (!error) {
      setItems(prev => [...prev.filter(i => i.nome_item !== newItemName), newItem as ShoppingItem]);
      setNewItemName('');
    }
    setIsAdding(false);
  };

  const togglePurchased = (nomeItem: string) => {
    setItems(prev => prev.map(item =>
      item.nome_item === nomeItem ? { ...item, comprado: !item.comprado } : item
    ));
  };

  const totalPrice = items.reduce((acc, curr) => acc + (curr.ultimo_preco_informado || 0), 0).toFixed(2);

  return (
    <div className="flex flex-col min-h-screen pb-52">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Meu Carrinho</h1>
        <button className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="px-4 pt-2 mb-6">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Adicionar item manualmente..."
              className="w-full h-12 pl-10 pr-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <button
            onClick={addItem}
            disabled={isAdding || !newItemName.trim()}
            className="h-12 px-4 bg-primary text-background-dark rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {isAdding ? '...' : 'Add'}
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-5 shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                Total Estimado
                {!canSumPrices && <Lock size={12} />}
              </span>
              <div
                className={`flex items-baseline gap-1 ${!canSumPrices ? 'cursor-pointer' : ''}`}
                onClick={!canSumPrices ? () => setShowUpgradeModal(true) : undefined}
              >
                <h2 className={`text-3xl font-extrabold tracking-tight transition-all ${!canSumPrices ? 'blur-md select-none' : ''}`}>
                  R$ {totalPrice}
                </h2>
                {!canSumPrices && <span className="text-xs text-primary font-bold ml-2">Upgrade p/ ver</span>}
              </div>
              <p className="text-sm font-medium text-primary-dark dark:text-primary flex items-center gap-1 mt-1">
                <ShoppingBasket size={16} className="fill-current" />
                {items.filter(i => !i.comprado).length} itens restantes
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-emerald-600 opacity-20 blur-xl absolute -right-4 -top-4"></div>
          </div>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: items.length > 0 ? `${(items.filter(i => i.comprado).length / items.length) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="sticky top-[72px] z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-2">
          <h3 className="text-xl font-bold tracking-tight">Lista de Compras</h3>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-gray-500">Carregando itens...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500">
            <Package className="text-4xl mb-2" size={40} />
            <p>Seu carrinho está vazio.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* Pending Items */}
            <div className="px-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Pendentes</h4>
              <div className="flex flex-col gap-2">
                {items.filter(i => !i.comprado).map((item) => (
                  <div key={item.nome_item} className="flex flex-col rounded-xl bg-white dark:bg-surface-dark p-2 pl-4 pr-3 shadow-sm border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => togglePurchased(item.nome_item)}
                          className="size-6 rounded-md border-2 border-slate-200 dark:border-gray-600 flex items-center justify-center transition-colors"
                        >
                          {item.comprado && <Check className="text-primary" size={18} />}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-sm font-bold leading-tight truncate">{item.nome_item}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {item.quantidade > 0 && <span>{item.quantidade} {item.unidade_preco || 'un'} • </span>}
                            R$ {item.ultimo_preco_informado.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.nome_item)}
                        className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchased Items */}
            {items.some(i => i.comprado) && (
              <div className="px-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Comprados</h4>
                <div className="flex flex-col gap-2 opacity-60 grayscale-[0.5]">
                  {items.filter(i => i.comprado).map((item) => (
                    <div key={item.nome_item} className="flex flex-col rounded-xl bg-slate-50 dark:bg-white/[0.02] p-2 pl-4 pr-3 border border-dashed border-slate-200 dark:border-white/10">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => togglePurchased(item.nome_item)}
                            className="size-6 rounded-md bg-primary border-2 border-primary flex items-center justify-center transition-colors"
                          >
                            <Check className="text-background-dark" size={18} />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-bold leading-tight truncate line-through text-slate-400">{item.nome_item}</h4>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.nome_item)}
                          className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 z-50 w-full border-t border-gray-200 bg-white dark:bg-surface-dark p-4 pb-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-sm text-slate-500">Total a Pagar</span>
            <span className={`text-xl font-bold transition-all ${!canSumPrices ? 'blur-sm select-none' : ''}`}>
              R$ {totalPrice}
            </span>
          </div>
          <button
            onClick={!canSumPrices ? () => setShowUpgradeModal(true) : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-black shadow-lg shadow-primary/25 active:scale-[0.98]"
          >
            <span>Confirmar Pedido</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradePrompt
          feature="A Soma Automática de Preços da sua lista"
          requiredPlan="simple"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <Navigation />
    </div>
  );
};

export default ShoppingCart;
