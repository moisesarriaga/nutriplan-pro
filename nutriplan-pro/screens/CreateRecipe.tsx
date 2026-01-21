
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { extractRecipeFromText, ExtractedRecipe, ExtractedIngredient } from '@/services/openaiService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Sparkles, Check, Plus, X } from 'lucide-react';

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get('id');
  const isEditing = !!recipeId;
  const { user } = useAuth();
  const [recipeText, setRecipeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualIngredient, setManualIngredient] = useState({ name: '', quantity: 0, unit: 'g', caloriesPerUnit: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 400;

      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = 'auto';
        textareaRef.current.style.height = `${maxHeight}px`;
      } else {
        textareaRef.current.style.overflowY = 'hidden';
        textareaRef.current.style.height = `${scrollHeight}px`;
      }
    }
  }, [recipeText]);

  // Efeito para travar o scroll da página de fundo quando o modal estiver aberto
  useEffect(() => {
    if (showManualModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showManualModal]);

  useEffect(() => {
    if (user && recipeId) {
      fetchRecipeData();
    }
  }, [user, recipeId]);

  const fetchRecipeData = async () => {
    try {
      setIsProcessing(true);
      const { data: recipe, error } = await supabase
        .from('receitas')
        .select('*, ingredientes(*)')
        .eq('id', recipeId)
        .single();

      if (error) throw error;

      if (recipe) {
        setRecipeName(recipe.nome);
        setRecipeInstructions(recipe.modo_preparo || '');

        const formattedIngredients: ExtractedIngredient[] = (recipe.ingredientes || []).map((ing: any) => ({
          name: ing.nome,
          quantity: Number(ing.quantidade),
          unit: ing.unidade,
          caloriesPerUnit: Number(ing.calories_per_unit) || 0,
          totalCalories: Number(ing.total_calories) || 0
        }));

        setIngredients(formattedIngredients);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      alert('Erro ao carregar receita para edição.');
      navigate('/search');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithAI = async () => {
    if (!recipeText.trim()) {
      alert('Por favor, cole o texto da receita primeiro.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractRecipeFromText(recipeText);
      setExtractedRecipe(result);
      setRecipeName(result.name);

      let formattedInstructions = result.instructions || '';
      formattedInstructions = formattedInstructions
        .replace(/([^\n])\s+(\d+\.\s)/g, '$1\n$2') // Adiciona quebra de linha antes de passos numerados (ex: 2. )
        .replace(/([^\d])\. +(?=[A-Z])/g, '$1.\n'); // Adiciona quebra de linha após frases, mas ignora números (ex: 1. Texto)

      setRecipeInstructions(formattedInstructions);
      setIngredients(result.ingredients);
      setShowPreview(true);
    } catch (error) {
      console.error('Error processing recipe:', error);
      alert('Erro ao processar receita: ' + (error instanceof Error ? error.message : 'Verifique sua conexão e se o serviço de IA está ativo no servidor.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateIngredient = (index: number, field: keyof ExtractedIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total calories for this ingredient
    if (field === 'quantity' || field === 'caloriesPerUnit') {
      const ing = updated[index];
      updated[index].totalCalories = (ing.quantity * ing.caloriesPerUnit) / 100;
    }

    setIngredients(updated);
  };

  const addManualIngredient = () => {
    if (!manualIngredient.name.trim()) {
      alert('Por favor, preencha o nome do ingrediente.');
      return;
    }

    const newIngredient: ExtractedIngredient = {
      name: manualIngredient.name,
      quantity: manualIngredient.quantity,
      unit: manualIngredient.unit,
      caloriesPerUnit: manualIngredient.caloriesPerUnit,
      totalCalories: (manualIngredient.quantity * manualIngredient.caloriesPerUnit) / 100
    };

    setIngredients([...ingredients, newIngredient]);
    setManualIngredient({ name: '', quantity: 0, unit: 'g', caloriesPerUnit: 0 });
    setShowManualModal(false);
    setShowPreview(true);
  };

  const saveRecipe = async () => {
    if (!user || !recipeName.trim() || ingredients.length === 0) {
      alert('Preencha o nome da receita e adicione pelo menos um ingrediente.');
      return;
    }

    const totalCalories = ingredients.reduce((sum, ing) => sum + ing.totalCalories, 0);

    try {
      // Save recipe to Supabase
      let recipeIdToUse = recipeId;

      if (isEditing && recipeId) {
        // Update existing recipe
        const { error: recipeError } = await supabase
          .from('receitas')
          .update({
            nome: recipeName,
            modo_preparo: recipeInstructions,
            total_calories: Math.round(totalCalories),
            nutritional_data: {
              ingredients: ingredients,
              totalCalories: Math.round(totalCalories)
            }
          })
          .eq('id', recipeId);

        if (recipeError) throw recipeError;

        // Delete existing ingredients to replace with new ones
        await supabase.from('ingredientes').delete().eq('receita_id', recipeId);
      } else {
        // Insert new recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from('receitas')
          .insert([{
            usuario_id: user.id,
            nome: recipeName,
            modo_preparo: recipeInstructions,
            total_calories: Math.round(totalCalories),
            nutritional_data: {
              ingredients: ingredients,
              totalCalories: Math.round(totalCalories)
            }
          }])
          .select()
          .single();

        if (recipeError) throw recipeError;
        recipeIdToUse = recipeData.id;
      }

      // Save ingredients
      const ingredientsToSave = ingredients.map(ing => ({
        receita_id: recipeIdToUse,
        nome: ing.name,
        quantidade: ing.quantity,
        unidade: ing.unit,
        calories_per_unit: ing.caloriesPerUnit,
        total_calories: ing.totalCalories
      }));

      const { error: ingredientsError } = await supabase
        .from('ingredientes')
        .insert(ingredientsToSave);

      if (ingredientsError) throw ingredientsError;

      alert(isEditing ? 'Receita atualizada com sucesso!' : 'Receita salva com sucesso!');
      navigate('/search');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Erro ao salvar receita: ' + (error as any).message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-slate-200/50">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">{isEditing ? 'Editar Receita' : 'Nova Receita com IA'}</h1>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary">Cancelar</button>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-6 pb-28">
        {!showPreview ? (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cole o texto da receita aqui</label>
                <div
                  className="w-full rounded-3xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden cursor-text"
                  onClick={() => textareaRef.current?.focus()}
                >
                  <textarea
                    ref={textareaRef}
                    className="w-[calc(100%-60px)] ml-6 my-4 bg-transparent border-none focus:ring-0 resize-none overflow-y-auto max-h-[400px] discrete-scrollbar text-slate-900 dark:text-white"
                    placeholder="Cole aqui o texto completo da receita (nome, ingredientes, modo de preparo)..."
                    rows={1}
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={processWithAI}
                  disabled={isProcessing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Processar com IA
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 px-6 py-4 text-black dark:text-white shadow-lg hover:shadow-lg transition-all active:scale-[0.98]"
                  title="Adicionar ingrediente manualmente"
                >
                  <Plus size={24} />
                </button>
              </div>
            </section>

            <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              <p className="font-semibold mb-1">💡 Dica:</p>
              <p>A IA irá extrair automaticamente o nome da receita, ingredientes (com quantidades e unidades) e calcular as calorias de cada item!</p>
            </div>
          </>
        ) : (
          <>
            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Receita</label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary transition-all shadow-sm"
                  placeholder="Ex: Panqueca de Aveia"
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo de Preparo</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary shadow-sm resize-none"
                  placeholder="Descreva o passo a passo..."
                  rows={12}
                  value={recipeInstructions}
                  onChange={(e) => setRecipeInstructions(e.target.value)}
                />
              </div>
            </section>

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-lg font-bold">Tabela Nutricional</h2>
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {Math.round(ingredients.reduce((sum, ing) => sum + ing.totalCalories, 0))} kcal total
              </span>
            </div>

            <section className="flex flex-col gap-4">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-gray-800 shadow-sm relative group">
                  <button
                    onClick={() => {
                      const newIngredients = [...ingredients];
                      newIngredients.splice(idx, 1);
                      setIngredients(newIngredients);
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remover ingrediente"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ingrediente {idx + 1}</label>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{Math.round(ing.totalCalories)} kcal</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome do Ingrediente</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ex: Arroz, Feijão, Frango..."
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Quantidade</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-center font-semibold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          type="number"
                          step="0.001"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Unidade</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-center font-semibold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          type="text"
                          value={ing.unit}
                          onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Calorias por 100g/ml</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-center font-semibold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        type="number"
                        value={ing.caloriesPerUnit}
                        onChange={(e) => updateIngredient(idx, 'caloriesPerUnit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-200 dark:bg-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-[0.98]"
            >
              <Plus size={20} />
              Adicionar mais ingredientes
            </button>

            <button
              onClick={() => setShowPreview(false)}
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              ← Voltar para editar texto
            </button>
          </>
        )}
      </main>

      {showPreview && (
        <footer className="fixed bottom-0 z-40 w-full max-w-[1000px] left-1/2 -translate-x-1/2 border-t border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg px-4 pt-4 pb-8 shadow-lg transition-colors duration-300">
          <button
            onClick={saveRecipe}
            className="w-full rounded-xl bg-primary px-6 py-4 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Salvar Receita
          </button>
        </footer>
      )}

      {/* Modal de Adição Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowManualModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-6">Adicionar Ingrediente</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Ingrediente</label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Ex: Arroz, Feijão, Frango..."
                  type="text"
                  value={manualIngredient.name}
                  onChange={(e) => setManualIngredient({ ...manualIngredient, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantidade</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                    type="number"
                    step="0.001"
                    value={manualIngredient.quantity}
                    onChange={(e) => setManualIngredient({ ...manualIngredient, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unidade</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                    value={manualIngredient.unit}
                    onChange={(e) => setManualIngredient({ ...manualIngredient, unit: e.target.value })}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                    <option value="xícara">xícara</option>
                    <option value="colher">colher</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Calorias por 100g/ml</label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                  type="number"
                  placeholder="Ex: 130"
                  value={manualIngredient.caloriesPerUnit}
                  onChange={(e) => setManualIngredient({ ...manualIngredient, caloriesPerUnit: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={addManualIngredient}
                  className="flex-1 rounded-xl bg-primary px-6 py-3 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRecipe;
