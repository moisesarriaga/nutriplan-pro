// Initialize Supabase Function URL
import { supabase, supabaseUrl } from "../lib/supabaseClient";
const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

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
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/process-recipe-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({ recipeText }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao processar a receita com IA');
        }

        const extractedData: ExtractedRecipe = await response.json();

        // Recalculate total calories to ensure accuracy
        extractedData.totalCalories = extractedData.ingredients.reduce(
            (sum, ing) => sum + ing.totalCalories,
            0
        );

        return extractedData;
    } catch (error) {
        console.error('Error extracting recipe:', error);
        throw new Error(error instanceof Error ? error.message : 'Falha ao processar a receita com IA.');
    }
};

// Estimate calories for a single ingredient (fallback function)
export const estimateIngredientCalories = async (ingredientName: string, quantity: number, unit: string): Promise<number> => {
    // This could also be moved to Edge Function if needed, for now we keep it simple
    return 0;
};
