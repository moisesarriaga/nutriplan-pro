// @ts-nocheck
declare const Deno: any;
import OpenAI from "openai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
});

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!Deno.env.get('OPENAI_API_KEY')) {
            throw new Error('OPENAI_API_KEY no environment do Supabase não configurado.');
        }

        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'Texto da receita é obrigatório.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Você é um nutricionista especialista. Extraia os detalhes da receita fornecida e retorne APENAS um JSON puro, sem markdown, seguindo este formato EXATO:
{
  "name": "nome da receita",
  "instructions": "passo a passo detalhado",
  "ingredients": [
    { "item": "nome do ingrediente", "quantidade": 100, "unidade": "g", "calorias": 150 }
  ]
}
O campo "calorias" deve ser o valor calórico TOTAL para a quantidade especificada.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

        if (!aiResponse.ingredients || !Array.isArray(aiResponse.ingredients)) {
            throw new Error("Resposta da IA não contém uma lista de ingredientes válida.");
        }

        // Map to frontend structure
        const ingredients = aiResponse.ingredients.map((item: any) => ({
            name: item.item,
            quantity: item.quantidade,
            unit: item.unidade,
            caloriesPerUnit: item.quantidade > 0 ? (item.calorias / item.quantidade) * 100 : item.calorias,
            totalCalories: item.calorias
        }));

        const totalCalories = ingredients.reduce((sum: number, ing: any) => sum + ing.totalCalories, 0);

        const extractedRecipe = {
            name: aiResponse.name || "Nova Receita",
            ingredients,
            totalCalories,
            instructions: aiResponse.instructions || ""
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
