import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY não encontrada no ambiente.");
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Analise o texto da receita abaixo e extraia os ingredientes.
Force a resposta a ser APENAS um JSON no formato de array puro, sem explicações ou markdown, usando este esquema EXATO:
[{ "item": string, "quantidade": number, "unidade": string, "calorias": number }]

O campo "calorias" deve ser o TOTAL para a quantidade especificada do ingrediente.

TEXTO DA RECEITA:
${recipeText}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        console.log("Resposta bruta da API Gemini:", rawText);

        // Clean text if AI includes markdown blocks
        const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const ingredientsList = JSON.parse(jsonText);

        if (!Array.isArray(ingredientsList)) {
            throw new Error("Resposta da IA não é um array de ingredientes.");
        }

        const ingredients: ExtractedIngredient[] = ingredientsList.map((item: any) => ({
            name: item.item,
            quantity: item.quantidade,
            unit: item.unidade,
            caloriesPerUnit: item.quantidade > 0 ? (item.calorias / item.quantidade) * 100 : item.calorias, // Guessing cal/100g or unit
            totalCalories: item.calorias
        }));

        const totalCalories = ingredients.reduce((sum, ing) => sum + ing.totalCalories, 0);

        return {
            name: "Nova Receita", // IA simplified to only ingredients as per user request
            ingredients,
            totalCalories,
            instructions: "" // IA simplified to only ingredients as per user request
        };
    } catch (error) {
        console.error('Error extracting recipe:', error);
        throw new Error(error instanceof Error ? error.message : 'Falha ao processar a receita com IA.');
    }
};

// Estimate calories for a single ingredient (fallback function)
export const estimateIngredientCalories = async (ingredientName: string, quantity: number, unit: string): Promise<number> => {
    return 0;
};

