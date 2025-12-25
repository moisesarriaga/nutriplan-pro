
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ShoppingItem {
  usuario_id: string;
  nome_item: string;
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

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

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
    // Persistence for 'comprado' is deferred as column might not exist
  };

  const totalPrice = items.reduce((acc, curr) => acc + (curr.ultimo_preco_informado || 0), 0).toFixed(2);

  return (
    <div className="flex flex-col min-h-screen pb-52">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Meu Carrinho</h1>
        <button className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <span className="material-symbols-outlined">more_horiz</span>
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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">add</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Estimado</span>
              <h2 className="text-3xl font-extrabold tracking-tight">R$ {totalPrice}</h2>
              <p className="text-sm font-medium text-primary-dark dark:text-primary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px] filled">shopping_basket</span>
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
            <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
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
                          {item.comprado && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-sm font-bold leading-tight truncate">{item.nome_item}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">R$ {item.ultimo_preco_informado.toFixed(2)} • {item.unidade_preco || 'un'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.nome_item)}
                        className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
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
                            <span className="material-symbols-outlined text-background-dark text-[18px]">check</span>
                          </button>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-bold leading-tight truncate line-through text-slate-400">{item.nome_item}</h4>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.nome_item)}
                          className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
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
            <span className="text-xl font-bold">R$ {totalPrice}</span>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-black shadow-lg shadow-primary/25 active:scale-[0.98]">
            <span>Confirmar Pedido</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default ShoppingCart;
