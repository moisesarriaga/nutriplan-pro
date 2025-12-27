
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractRecipeFromText, ExtractedRecipe, ExtractedIngredient } from '../../services/geminiService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipeText, setRecipeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);

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
      setRecipeInstructions(result.instructions || '');
      setIngredients(result.ingredients);
      setShowPreview(true);
    } catch (error) {
      console.error('Error processing recipe:', error);
      alert('Erro ao processar receita com IA. Verifique sua API key do Gemini.');
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

  const saveRecipe = async () => {
    if (!user || !recipeName.trim() || ingredients.length === 0) {
      alert('Preencha o nome da receita e adicione pelo menos um ingrediente.');
      return;
    }

    const totalCalories = ingredients.reduce((sum, ing) => sum + ing.totalCalories, 0);

    try {
      // Save recipe to Supabase
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

      // Save ingredients
      const ingredientsToSave = ingredients.map(ing => ({
        receita_id: recipeData.id,
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

      alert('Receita salva com sucesso!');
      navigate('/search');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Erro ao salvar receita: ' + (error as any).message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-slate-200/50">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">Nova Receita com IA</h1>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary">Cancelar</button>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-6 pb-28">
        {!showPreview ? (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cole o texto da receita aqui</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary shadow-sm resize-none"
                  placeholder="Cole aqui o texto completo da receita (nome, ingredientes, modo de preparo)..."
                  rows={12}
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                />
              </div>

              <button
                onClick={processWithAI}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Processar com IA
                  </>
                )}
              </button>
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
                  rows={4}
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

            <section className="flex flex-col gap-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingrediente {idx + 1}</label>
                    <span className="text-xs font-bold text-primary">{Math.round(ing.totalCalories)} kcal</span>
                  </div>

                  <input
                    className="w-full border-0 border-b border-slate-200 dark:border-gray-700 bg-transparent px-0 py-2 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:border-primary transition-colors mb-3"
                    placeholder="Nome do item"
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500">Quantidade</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-center font-medium focus:ring-primary transition-all"
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500">Unidade</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-center font-medium focus:ring-primary transition-all"
                        type="text"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500">Cal/100g</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-center font-medium focus:ring-primary transition-all"
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
              onClick={() => setShowPreview(false)}
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              ← Voltar para editar texto
            </button>
          </>
        )}
      </main>

      {showPreview && (
        <footer className="fixed bottom-0 z-40 w-full max-w-md border-t border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg px-4 pt-4 pb-8 shadow-lg">
          <button
            onClick={saveRecipe}
            className="w-full rounded-xl bg-primary px-6 py-4 text-base font-bold text-black shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">check</span>
            Salvar Receita
          </button>
        </footer>
      )}
    </div>
  );
};

export default CreateRecipe;
