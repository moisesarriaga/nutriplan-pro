// @ts-nocheck
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment');
        }

        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'Recipe text is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Analise o texto da receita abaixo e extraia os ingredientes.
Force a resposta a ser APENAS um JSON no formato de array puro, sem explicações ou markdown, usando este esquema EXATO:
[{ "item": string, "quantidade": number, "unidade": string, "calorias": number }]

O campo "calorias" deve ser o TOTAL para a quantidade especificada do ingrediente.

TEXTO DA RECEITA:
${text}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        // Clean text if AI includes markdown blocks
        const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let ingredientsList;
        try {
            ingredientsList = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse AI response:", rawText);
            throw new Error("Failed to parse AI response as JSON");
        }

        if (!Array.isArray(ingredientsList)) {
            throw new Error("AI response is not an array");
        }

        const ingredients = ingredientsList.map((item: any) => ({
            name: item.item,
            quantity: item.quantidade,
            unit: item.unidade,
            // Calculate cal/100g or unit if possible, otherwise rely on total.
            // Simplified logic: store total as provided by AI
            caloriesPerUnit: item.quantidade > 0 ? (item.calorias / item.quantidade) * 100 : item.calorias,
            totalCalories: item.calorias
        }));

        const totalCalories = ingredients.reduce((sum: number, ing: any) => sum + ing.totalCalories, 0);

        const extractedRecipe = {
            name: "Nova Receita",
            ingredients,
            totalCalories,
            instructions: ""
        };

        return new Response(JSON.stringify(extractedRecipe), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in extract-recipe-details:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
