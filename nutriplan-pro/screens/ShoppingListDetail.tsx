
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradePrompt from '../../components/UpgradePrompt';

interface ShoppingItem {
  usuario_id: string;
  nome_item: string;
  quantidade: number;
  ultimo_preco_informado: number;
  unidade_preco: string;
  comprado?: boolean;
  created_at?: string;
  grupo_nome?: string; // Add group name field
  concluido?: boolean; // Add concluded field
}

const ShoppingListDetail: React.FC = () => {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [listName, setListName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');
  const [showDuplicateRenameConfirm, setShowDuplicateRenameConfirm] = useState(false);
  const { hasFeature } = useSubscription();

  const canSumPrices = hasFeature('price_sum');

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
      fetchItems();
    }
  }, [user, listId]);

  const formatGroupName = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const fetchItems = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .select('*')
      .eq('usuario_id', user.id);

    if (!error && data) {
      // Decode listId from URL
      const decodedListId = listId ? decodeURIComponent(listId) : '';

      // Filter items by listId (grupo_nome)
      const filteredItems = decodedListId === 'new' ? [] : data.filter((item: ShoppingItem) => {
        const itemGroup = item.grupo_nome || 'Sem Grupo';
        return itemGroup === decodedListId;
      });

      setItems(filteredItems);

      // Set list name
      if (decodedListId === 'new') {
        setListName('Nova Lista');
      } else {
        setListName(decodedListId.split(' ::: ')[0]); // Use clean group name
      }
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
      unidade_preco: 'un',
      comprado: false
    };

    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .insert(newItem)
      .select()
      .single();

    if (!error && data) {
      setItems(prev => [...prev, data as ShoppingItem]);
      setNewItemName('');
    }
    setIsAdding(false);
  };

  const togglePurchased = async (nomeItem: string) => {
    const item = items.find(i => i.nome_item === nomeItem);
    if (!item || !user) return;

    const newCompradoState = !item.comprado;

    const { error } = await supabase
      .from('lista_precos_mercado')
      .update({ comprado: newCompradoState })
      .eq('usuario_id', user.id)
      .eq('nome_item', nomeItem);

    if (!error) {
      setItems(prev => prev.map(i =>
        i.nome_item === nomeItem ? { ...i, comprado: newCompradoState } : i
      ));
    }
  };

  const handleRenameClick = () => {
    setTempGroupName(listName);
    setShowRenameModal(true);
  };

  const checkAndPrepareRename = async () => {
    if (!tempGroupName.trim() || !user) return;

    // Search for any group that has this display name (part before ' ::: ')
    const { data: existingGroups, error } = await supabase
      .from('lista_precos_mercado')
      .select('grupo_nome')
      .eq('usuario_id', user.id)
      .ilike('grupo_nome', `${tempGroupName.trim()} ::: %`)
      .limit(1);

    if (existingGroups && existingGroups.length > 0 && tempGroupName.trim() !== listName) {
      setShowDuplicateRenameConfirm(true);
    } else {
      executeRename();
    }
  };

  const executeRename = async () => {
    if (!user || !listId) return;

    const decodedListId = decodeURIComponent(listId);
    // Keep the same timestamp suffix if it exists, replace name part
    const suffix = decodedListId.includes(' ::: ') ? decodedListId.split(' ::: ')[1] : Date.now();
    const newFullGroupName = `${tempGroupName.trim()} ::: ${suffix}`;

    const { error } = await supabase
      .from('lista_precos_mercado')
      .update({ grupo_nome: newFullGroupName })
      .eq('usuario_id', user.id)
      .eq('grupo_nome', decodedListId);

    if (!error) {
      setShowRenameModal(false);
      setShowDuplicateRenameConfirm(false);
      // Navigate to the new URL to reflect the name change in the state/fetch
      navigate(`/cart/${encodeURIComponent(newFullGroupName)}`, { replace: true });
    }
  };

  const finishList = async () => {
    if (!user || !listId || items.length === 0) return;

    const decodedListId = decodeURIComponent(listId);

    const { error } = await supabase
      .from('lista_precos_mercado')
      .update({ concluido: true })
      .eq('usuario_id', user.id)
      .eq('grupo_nome', decodedListId);

    if (!error) {
      navigate('/cart'); // Return to overview
    }
  };

  const totalPrice = items.reduce((acc, curr) => acc + (curr.ultimo_preco_informado || 0), 0).toFixed(2);
  const allChecked = items.length > 0 && items.every(i => i.comprado);
  const isHistoryList = items.length > 0 && items[0].concluido;

  return (
    <div className="flex flex-col min-h-screen pb-52">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-4 backdrop-blur-md">
        <button onClick={() => navigate('/cart')} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">{listName}</h1>
          <button onClick={handleRenameClick} className="flex size-8 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors">
            <span className="material-symbols-rounded text-[18px]">edit</span>
          </button>
        </div>
        <div className="size-10"></div>
      </header>

      <div className="px-4 pt-2 mb-6">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Adicionar item..."
              className="w-full h-12 pl-10 pr-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">add</span>
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
                {!canSumPrices && <span className="material-symbols-rounded text-[12px]">lock</span>}
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
                <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
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
        {loading ? (
          <div className="px-4 py-10 text-center text-gray-500">Carregando itens...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500">
            <span className="material-symbols-rounded text-[40px] mb-2">inventory_2</span>
            <p>Lista vazia. Adicione itens acima.</p>
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
                          {item.comprado && <span className="material-symbols-rounded text-primary text-[18px]">check</span>}
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
                        <span className="material-symbols-rounded text-[20px]">delete</span>
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
                            <span className="material-symbols-rounded text-background-dark text-[18px]">check</span>
                          </button>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-bold leading-tight truncate line-through text-slate-400">{item.nome_item}</h4>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.nome_item)}
                          className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-rounded text-[20px]">delete</span>
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
            onClick={allChecked && !isHistoryList ? finishList : (!canSumPrices ? () => setShowUpgradeModal(true) : undefined)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold text-black shadow-lg active:scale-[0.98] transition-all ${allChecked && !isHistoryList ? 'bg-primary shadow-primary/30' : 'bg-primary/80 shadow-primary/20'}`}
          >
            <span>{allChecked && !isHistoryList ? 'Finalizar Compra' : 'Confirmar Pedido'}</span>
            <span className="material-symbols-rounded text-[20px]">{allChecked && !isHistoryList ? 'check_circle' : 'arrow_forward'}</span>
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

      {/* Modal de Renomear Grupo */}
      {showRenameModal && !showDuplicateRenameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-center">Renomear Lista</h3>
            <p className="text-sm text-center text-slate-500 mb-6">Digite o novo nome para esta lista:</p>

            <input
              type="text"
              value={tempGroupName}
              onChange={(e) => setTempGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAndPrepareRename()}
              placeholder="Ex: Feira Mensal, Compras..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={checkAndPrepareRename}
                disabled={!tempGroupName.trim() || tempGroupName.trim() === listName}
                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Nome Duplicado ao Renomear */}
      {showDuplicateRenameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <span className="material-symbols-rounded text-[32px]">warning</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Nome já existe</h3>
              <p className="text-sm text-slate-500 mb-6 px-2">
                Já existe um grupo chamado "<span className="font-bold text-slate-800 dark:text-white">{tempGroupName}</span>". Deseja renomear para este mesmo nome mesmo assim?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateRenameConfirm(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-slate-800"
              >
                Não
              </button>
              <button
                onClick={executeRename}
                className="flex-1 h-12 rounded-xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default ShoppingListDetail;
