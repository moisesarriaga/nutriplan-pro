
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([
    { id: '1', name: 'Farinha de Aveia', quantity: 200, unit: 'g', priceType: '/kg' },
    { id: '2', name: 'Banana Prata', quantity: 2, unit: 'un', priceType: '/kg' }
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', quantity: 0, unit: 'un', priceType: '/un' }]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-slate-200/50">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">Nova Receita</h1>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary">Cancelar</button>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-6 pb-28">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Receita</label>
            <input 
              className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Ex: Panqueca de Aveia" 
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição / Modo de Preparo</label>
            <textarea 
              className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary shadow-sm resize-none"
              placeholder="Descreva o passo a passo..." 
              rows={4}
            />
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-bold">Ingredientes</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{ingredients.length} itens</span>
        </div>

        <section className="flex flex-col gap-4">
          {ingredients.map((ing, idx) => (
            <div key={ing.id} className="group relative flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingrediente {idx + 1}</label>
                <button 
                  onClick={() => removeIngredient(ing.id)}
                  className="text-slate-400 hover:text-red-500 p-1 -mr-2 -mt-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <div>
                <input 
                  className="w-full border-0 border-b border-slate-200 dark:border-gray-700 bg-transparent px-0 py-2 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:border-primary transition-colors" 
                  placeholder="Nome do item" 
                  type="text" 
                  defaultValue={ing.name}
                />
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">Qtd</span>
                  <input className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-center font-medium focus:ring-primary transition-all" type="number" defaultValue={ing.quantity} />
                </div>
                <div className="col-span-4 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">Unidade</span>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium focus:ring-primary">
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="un">un</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><span className="material-symbols-outlined text-[16px]">expand_more</span></span>
                  </div>
                </div>
                <div className="col-span-4 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">Tipo Preço</span>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium focus:ring-primary">
                      <option value="kg">/kg</option>
                      <option value="un">/un</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><span className="material-symbols-outlined text-[16px]">expand_more</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addIngredient}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/10 px-6 py-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Adicionar Ingrediente
          </button>
        </section>
      </main>

      <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg px-4 pt-4 pb-8 shadow-lg">
        <button className="w-full rounded-xl bg-primary px-6 py-4 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">check</span>
          Salvar Receita
        </button>
      </footer>
    </div>
  );
};

export default CreateRecipe;
