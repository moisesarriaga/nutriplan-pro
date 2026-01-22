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

export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-recipe-image', {
            body: { recipeName, recipeDescription }
        });

        if (error) {
            console.error('Supabase Function Error:', error);
            throw new Error(error.message || 'Erro ao gerar imagem via servidor.');
        }

        if (!data || !data.imageUrl) {
            throw new Error('Nenhuma URL de imagem retornada do servidor.');
        }

        return data.imageUrl;

    } catch (error) {
        console.error('Error generating recipe image:', error);
        // Fallback to a food-related unsplash image if generation fails to not block saving
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
    }
};
