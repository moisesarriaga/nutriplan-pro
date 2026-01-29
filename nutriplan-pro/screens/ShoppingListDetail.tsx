
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNotification } from '../../contexts/NotificationContext';
import UpgradePrompt from '../../components/UpgradePrompt';

interface ShoppingItem {
  usuario_id: string;
  nome_item: string;
  quantidade: number;
  quantidade_usuario: number | null;
  ultimo_preco_informado: number | null;
  unidade_preco: string;
  unidade_receita: string; // Immutable unit from recipe
  comprado?: boolean;
  created_at?: string;
  grupo_nome?: string; // Add group name field
  concluido?: boolean; // Add concluded field
}

const ShoppingListDetail: React.FC = () => {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { showConfirmation } = useNotification();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [listName, setListName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');
  const [showDuplicateRenameConfirm, setShowDuplicateRenameConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
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
        return itemGroup === decodedListId && item.nome_item !== '_empty_';
      });

      setItems(filteredItems);

      // Set list name
      if (decodedListId === 'new') {
        const stateName = location.state?.listName;
        setListName(stateName || 'Nova Lista');
      } else {
        setListName(decodedListId.split(' ::: ')[0]); // Use clean group name
      }
    }
    setLoading(false);
  };

  const deleteItem = async (nomeItem: string) => {
    if (!user || !listId) return;
    const decodedListId = decodeURIComponent(listId);

    const { error } = await supabase
      .from('lista_precos_mercado')
      .delete()
      .eq('usuario_id', user.id)
      .eq('nome_item', nomeItem)
      .eq('grupo_nome', decodedListId);

    if (!error) {
      setItems(prev => prev.filter(i => i.nome_item !== nomeItem));
    }
  };

  const addItem = async () => {
    if (!user || !newItemName.trim() || !listId) return;
    setIsAdding(true);

    const decodedListId = decodeURIComponent(listId);
    let finalGroupName = decodedListId;

    // If it's a brand new list, use the name from state/context and add a timestamp
    if (decodedListId === 'new') {
      const timestamp = Date.now();
      finalGroupName = `${listName} ::: ${timestamp}`;
    }

    const newItem: Partial<ShoppingItem> = {
      usuario_id: user.id,
      nome_item: newItemName,
      quantidade: 1,
      quantidade_usuario: null,
      ultimo_preco_informado: null,
      unidade_preco: '',
      unidade_receita: '', // Initialize as empty for manual items
      comprado: false,
      grupo_nome: finalGroupName,
      concluido: false
    };

    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .insert(newItem)
      .select()
      .single();

    if (!error && data) {
      setItems(prev => [...prev, data as ShoppingItem]);
      setNewItemName('');

      // If we just created a new list group, navigate to its real ID
      if (decodedListId === 'new') {
        navigate(`/cart/${encodeURIComponent(finalGroupName)}`, { replace: true });
      }
    }
    setIsAdding(false);
  };

  const togglePurchased = async (nomeItem: string) => {
    const item = items.find(i => i.nome_item === nomeItem);
    if (!item || !user || !listId) return;

    const decodedListId = decodeURIComponent(listId);
    const newCompradoState = !item.comprado;

    const { error } = await supabase
      .from('lista_precos_mercado')
      .update({ comprado: newCompradoState })
      .eq('usuario_id', user.id)
      .eq('nome_item', nomeItem)
      .eq('grupo_nome', decodedListId);

    if (!error) {
      setItems(prev => prev.map(i =>
        i.nome_item === nomeItem ? { ...i, comprado: newCompradoState } : i
      ));
    }
  };

  const updateItem = async (nomeItem: string, updates: Partial<ShoppingItem>) => {
    if (!user || !listId) return;
    const decodedListId = decodeURIComponent(listId);

    const { error } = await supabase
      .from('lista_precos_mercado')
      .update(updates)
      .eq('usuario_id', user.id)
      .eq('nome_item', nomeItem)
      .eq('grupo_nome', decodedListId);

    if (!error) {
      setItems(prev => prev.map(i =>
        i.nome_item === nomeItem ? { ...i, ...updates } : i
      ));
    }
  };

  const saveEmptyList = async () => {
    if (!user || !listId || listId !== 'new') return;

    const timestamp = Date.now();
    const finalGroupName = `${listName} ::: ${timestamp}`;

    const emptyItem: Partial<ShoppingItem> = {
      usuario_id: user.id,
      nome_item: '_empty_',
      quantidade: 0,
      quantidade_usuario: null,
      ultimo_preco_informado: null,
      unidade_preco: '',
      unidade_receita: '', // Initialize as empty
      comprado: false,
      grupo_nome: finalGroupName,
      concluido: false
    };

    const { error } = await supabase
      .from('lista_precos_mercado')
      .insert(emptyItem);

    if (!error) {
      navigate('/cart');
    }
  };

  const handleBack = () => {
    if (listId === 'new' && items.length === 0) {
      showConfirmation('Você não adicionou nenhum item nesta lista. Deseja sair e salvar a lista vazia mesmo assim?', {
        title: 'Lista Vazia',
        confirmLabel: 'Sim, salvar',
        cancelLabel: 'Não, sair',
        onConfirm: saveEmptyList,
        onCancel: () => navigate('/cart'),
        variant: 'primary'
      });
    } else {
      navigate(-1);
    }
  };

  const handleRenameClick = () => {
    setTempGroupName(listName);
    setShowRenameModal(true);
  };

  const checkAndPrepareRename = async () => {
    if (!tempGroupName.trim() || !user) return;

    const { data: existingGroups, error } = await supabase
      .from('lista_precos_mercado')
      .select('grupo_nome')
      .eq('usuario_id', user.id)
      .eq('concluido', false)
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
      navigate('/history');
    }
  };

  const totalPrice = items.reduce((acc, curr) => acc + ((curr.quantidade_usuario || 0) * (curr.ultimo_preco_informado || 0)), 0).toFixed(2);
  const allChecked = items.length > 0 && items.every(i => i.comprado);
  const isHistoryList = items.length > 0 && items[0].concluido;

  useEffect(() => {
    if (allChecked && !isHistoryList && !loading && !showFinishConfirm) {
      const timer = setTimeout(() => {
        setShowFinishConfirm(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allChecked, isHistoryList, loading]);

  return (
    <div className="flex flex-col min-h-screen pb-48">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-4 backdrop-blur-md">
        <button onClick={handleBack} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight">{listName}</h1>
            <button
              onClick={() => {
                setTempGroupName(listName);
                setShowRenameModal(true);
              }}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-rounded text-primary text-[20px]">edit</span>
            </button>
          </div>
        </div>
        <div className="size-10"></div>
      </header>

      <div className="px-4 pt-2 mb-6">
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
                  <div key={item.nome_item} className="flex flex-col rounded-2xl bg-white dark:bg-surface-dark p-3 pl-4 pr-3 shadow-sm border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pt-1">
                        <button
                          onClick={() => togglePurchased(item.nome_item)}
                          className="size-6 shrink-0 rounded-md border-2 border-slate-200 dark:border-gray-600 flex items-center justify-center transition-colors"
                        >
                          {item.comprado && <span className="material-symbols-rounded text-primary text-[18px]">check</span>}
                        </button>
                        <div className="flex flex-col flex-1 min-w-0">
                          <h4 className="text-[15px] font-bold leading-tight truncate">{item.nome_item}</h4>
                          <p className="text-[10px] text-slate-500 font-medium opacity-80 mt-0.5">
                            {item.quantidade > 0 ? (
                              <span>Receita: {item.quantidade} {item.unidade_receita || 'un'}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.nome_item)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[20px]">delete</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pl-9 gap-3">
                      <div className="flex flex-col gap-1 items-center flex-1 max-w-[50px]">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">Qtd</span>
                        <input
                          type="number"
                          value={item.quantidade_usuario ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            setItems(prev => prev.map(i => i.nome_item === item.nome_item ? { ...i, quantidade_usuario: val } : i));
                          }}
                          onBlur={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            updateItem(item.nome_item, { quantidade_usuario: val });
                          }}
                          className="w-full h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1 items-center flex-1 max-w-[65px]">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">Un</span>
                        <div className="relative w-full">
                          <select
                            value={item.unidade_preco || ''}
                            onChange={(e) => {
                              setItems(prev => prev.map(i => i.nome_item === item.nome_item ? { ...i, unidade_preco: e.target.value } : i));
                              updateItem(item.nome_item, { unidade_preco: e.target.value });
                            }}
                            className="w-full h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-slate-900 dark:text-white text-center pl-1 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer appearance-none shadow-sm transition-all"
                          >
                            <option value="" className="bg-white dark:bg-surface-dark">-</option>
                            {['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx', 'dz'].map(u => (
                              <option key={u} value={u} className="bg-white dark:bg-surface-dark">{u}</option>
                            ))}
                          </select>
                          <span className="material-symbols-rounded absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[14px] pointer-events-none opacity-50">
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-center flex-1">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">Preço</span>
                        <div className="relative w-full">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={item.ultimo_preco_informado ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              setItems(prev => prev.map(i => i.nome_item === item.nome_item ? { ...i, ultimo_preco_informado: val } : i));
                            }}
                            onBlur={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              updateItem(item.nome_item, { ultimo_preco_informado: val });
                            }}
                            className="w-full h-8 pl-7 pr-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm transition-all"
                          />
                        </div>
                      </div>
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
                    <div key={item.nome_item} className="flex flex-col rounded-2xl bg-slate-50 dark:bg-white/[0.02] p-3 pl-4 pr-3 border border-dashed border-slate-200 dark:border-white/10 opacity-70 grayscale-[0.2]">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0 pt-1">
                          <button
                            onClick={() => togglePurchased(item.nome_item)}
                            className="size-6 shrink-0 rounded-md bg-primary border-2 border-primary flex items-center justify-center transition-colors"
                          >
                            <span className="material-symbols-rounded text-background-dark text-[18px]">check</span>
                          </button>
                          <div className="flex flex-col flex-1 min-w-0">
                            <h4 className="text-[15px] font-bold leading-tight truncate line-through text-slate-400">{item.nome_item}</h4>
                            <p className="text-[10px] text-slate-500 font-medium opacity-50 mt-0.5">
                              {item.quantidade > 0 ? (
                                <span>Receita: {item.quantidade} {item.unidade_receita || 'un'}</span>
                              ) : (
                                <span>-</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.nome_item)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-rounded text-[20px]">delete</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 pl-9 gap-3 opacity-60">
                        <div className="flex flex-col gap-1 items-center flex-1 max-w-[50px]">
                          <span className="text-[9px] uppercase text-slate-400 font-bold">Qtd</span>
                          <input
                            type="number"
                            disabled
                            value={item.quantidade_usuario ?? ''}
                            className="w-full h-8 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg text-xs text-center font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1 items-center flex-1 max-w-[65px]">
                          <span className="text-[9px] uppercase text-slate-400 font-bold">Un</span>
                          <div className="relative w-full">
                            <select
                              disabled
                              value={item.unidade_preco || ''}
                              className="w-full h-8 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg text-[11px] font-bold text-slate-900 dark:text-white text-center pl-1 pr-4 appearance-none"
                            >
                              <option value={item.unidade_preco || ''} className="bg-white dark:bg-surface-dark">{item.unidade_preco || '-'}</option>
                            </select>
                            <span className="material-symbols-rounded absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[14px] pointer-events-none opacity-30">
                              expand_more
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-center flex-1">
                          <span className="text-[9px] uppercase text-slate-400 font-bold">Preço</span>
                          <div className="relative w-full">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              disabled
                              value={item.ultimo_preco_informado ?? ''}
                              className="w-full h-8 pl-7 pr-2 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Item Input */}
      <div className="fixed bottom-[74px] left-0 w-full z-40 px-4">
        <div className="max-w-md mx-auto flex gap-2 p-2 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-lg rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Adicionar item..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">add</span>
          </div>
          <button
            onClick={addItem}
            disabled={isAdding || !newItemName.trim()}
            className="h-11 w-11 flex items-center justify-center bg-primary text-background-dark rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            {isAdding ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-background-dark border-t-transparent"></div>
            ) : (
              <span className="material-symbols-rounded text-[22px]">add</span>
            )}
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

      {/* Modal de Confirmação de Finalização */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-rounded text-[32px]">task_alt</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Concluir Lista</h3>
              <p className="text-sm text-slate-500 mb-6 px-2">
                Todos os itens foram marcados. Concluir esta lista?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-slate-800"
              >
                Não
              </button>
              <button
                onClick={finishList}
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
