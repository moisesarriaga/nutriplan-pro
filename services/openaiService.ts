import { supabase } from '../lib/supabaseClient';

export interface ExtractedIngredient {
    name: string;
    quantity: number;
    unit: string;
    caloriesPerUnit: number;
    totalCalories: number;
}

export interface ExtractedRecipe {
    name: string;
    ingredients: ExtractedIngredient[];
    totalCalories: number;
    instructions?: string;
}

export const extractRecipeFromText = async (recipeText: string): Promise<ExtractedRecipe> => {
    try {
        const { data, error } = await supabase.functions.invoke('extract-recipe-details', {
            body: { text: recipeText }
        });

        if (error) {
            console.error('Supabase Function Error:', error);
            throw new Error(error.message || 'Erro ao processar receita via servidor.');
        }

        if (!data) {
            throw new Error('Nenhum dado retornado do servidor.');
        }

        return data as ExtractedRecipe;

    } catch (error) {
        console.error('Error extracting recipe:', error);
        throw new Error(error instanceof Error ? error.message : 'Falha ao processar a receita.');
    }
};

/**
 * Estimate calories for a single ingredient (fallback function)
 * @deprecated Use extractRecipeFromText for AI-powered extraction
 */
export const estimateIngredientCalories = async (_ingredientName: string, _quantity: number, _unit: string): Promise<number> => {
    return 0;
};
