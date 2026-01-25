
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ShoppingBasket, ChevronRight, History, Trash2 } from 'lucide-react';

interface ShoppingListGroup {
  id: string;
  name: string;
  itemCount: number;
  totalPrice: number;
  completedCount: number;
  createdAt: Date;
  concluido: boolean;
  originalName: string; // Keep track of the full database name for deletion
}

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showConfirmation, showNotification } = useNotification();
  const [groups, setGroups] = useState<ShoppingListGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('lista_precos_mercado')
      .select('*')
      .eq('usuario_id', user.id);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Group items by grupo_nome (or "Sem Grupo" if null)
    const groupedByName = data.reduce((acc: any, item: any) => {
      const groupKey = item.grupo_nome || 'Sem Grupo';

      if (!acc[groupKey]) {
        acc[groupKey] = {
          id: groupKey,
          name: groupKey,
          items: [],
          createdAt: new Date(item.created_at || Date.now())
        };
      }

      acc[groupKey].items.push(item);
      return acc;
    }, {});

    // Convert to array and calculate stats
    const groupsArray: ShoppingListGroup[] = Object.values(groupedByName)
      .map((group: any) => ({
        id: group.id,
        name: group.name.split(' ::: ')[0], // Strip unique suffix for display
        originalName: group.name,
        itemCount: group.items.length,
        completedCount: group.items.filter((i: any) => i.comprado).length,
        totalPrice: group.items.reduce((sum: number, item: any) => sum + (item.ultimo_preco_informado || 0), 0),
        createdAt: group.createdAt,
        concluido: group.items.some((i: any) => i.concluido) // If any item is marked as concluded, the group is
      }))
      .filter(g => g.id !== 'Sem Grupo'); // Hide "Sem Grupo" from the UI

    // Sort by creation date (newest first)
    groupsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setGroups(groupsArray);
    setLoading(false);
  };

  const handleDeleteGroup = (group: ShoppingListGroup, e: React.MouseEvent) => {
    e.stopPropagation();

    showConfirmation(`Deseja realmente apagar a lista "${group.name}"? Esta ação removerá todos os itens desta lista.`, {
      title: 'Apagar Lista',
      onConfirm: async () => {
        try {
          const query = supabase
            .from('lista_precos_mercado')
            .delete()
            .eq('usuario_id', user?.id);

          if (group.originalName === 'Sem Grupo') {
            query.is('grupo_nome', null);
          } else {
            query.eq('grupo_nome', group.originalName);
          }

          const { error } = await query;

          if (error) throw error;

          showNotification('Lista apagada com sucesso!');
          fetchGroups();
        } catch (err) {
          console.error('Error deleting group:', err);
          showNotification('Erro ao apagar lista. Tente novamente.', { iconType: 'error' });
        }
      }
    });
  };

  const createNewList = () => {
    // Navigate to detail page with "new" as id to create a new list
    navigate('/cart/new');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Minhas Listas</h1>
        <button onClick={() => navigate('/history')} className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5 transition-colors">
          <History size={20} />
        </button>
      </header>

      <div className="flex-1 px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : groups.filter(g => !g.concluido).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBasket className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhuma lista ativa</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
              Gere uma nova lista de compras a partir do seu cardápio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups
              .filter(group => !group.concluido)
              .map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate(`/cart/${encodeURIComponent(group.id)}`)}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30"
                >
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${group.concluido ? 'bg-slate-100 dark:bg-white/5' : 'bg-primary/10'}`}>
                    {group.concluido ? (
                      <span className="material-symbols-rounded text-slate-400 text-[28px]">done_all</span>
                    ) : (
                      <ShoppingBasket className="text-primary" size={28} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold mb-1 ${group.concluido ? 'text-slate-500' : ''}`}>{group.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{group.itemCount} {group.itemCount === 1 ? 'item' : 'itens'}</span>
                      <span>•</span>
                      <span className={`${group.concluido ? '' : 'text-primary'} font-medium`}>R$ {group.totalPrice.toFixed(2)}</span>
                    </div>

                    {!group.concluido && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${group.itemCount > 0 ? (group.completedCount / group.itemCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteGroup(group, e)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Apagar Grupo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <Navigation />
    </div >
  );
};

export default ShoppingCart;
