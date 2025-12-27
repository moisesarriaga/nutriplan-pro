import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
Você é um assistente especializado em nutrição e culinária. Analise o seguinte texto de receita e extraia as informações em formato JSON.

TEXTO DA RECEITA:
${recipeText}

INSTRUÇÕES:
1. Extraia o nome da receita
2. Para cada ingrediente, extraia:
   - nome (normalizado, sem artigos)
   - quantidade (número)
   - unidade (g, kg, ml, L, unidade, xícara, colher, etc.)
   - caloriesPerUnit: estime as calorias por 100g ou por unidade (use conhecimento nutricional)
   - totalCalories: calcule (quantidade * caloriesPerUnit / 100) se for em gramas, ou (quantidade * caloriesPerUnit) se for unidade

3. Calcule o total de calorias da receita (soma de todos os ingredientes)

IMPORTANTE:
- Se a unidade for "xícara", converta para gramas (1 xícara ≈ 240ml ou 120-150g dependendo do ingrediente)
- Se a unidade for "colher de sopa", converta para gramas (1 colher ≈ 15ml ou 10-15g)
- Para ingredientes sem quantidade específica (ex: "sal a gosto"), use 0 calorias
- Normalize as unidades para: g, kg, ml, L, ou unidade

Retorne APENAS um objeto JSON válido no seguinte formato (sem markdown, sem explicações):
{
  "name": "Nome da Receita",
  "ingredients": [
    {
      "name": "farinha de trigo",
      "quantity": 500,
      "unit": "g",
      "caloriesPerUnit": 364,
      "totalCalories": 1820
    }
  ],
  "totalCalories": 0,
  "instructions": "Modo de preparo extraído (opcional)"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response to extract JSON
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        // Parse the JSON
        const extractedData: ExtractedRecipe = JSON.parse(jsonText);

        // Recalculate total calories to ensure accuracy
        extractedData.totalCalories = extractedData.ingredients.reduce(
            (sum, ing) => sum + ing.totalCalories,
            0
        );

        return extractedData;
    } catch (error) {
        console.error('Error extracting recipe:', error);
        throw new Error('Falha ao processar a receita com IA. Verifique o formato do texto.');
    }
};

// Estimate calories for a single ingredient (fallback function)
export const estimateIngredientCalories = async (ingredientName: string, quantity: number, unit: string): Promise<number> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
Estime as calorias para o seguinte ingrediente:
Ingrediente: ${ingredientName}
Quantidade: ${quantity} ${unit}

Retorne APENAS um número (as calorias totais estimadas). Sem texto adicional.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        return parseInt(text) || 0;
    } catch (error) {
        console.error('Error estimating calories:', error);
        return 0;
    }
};
