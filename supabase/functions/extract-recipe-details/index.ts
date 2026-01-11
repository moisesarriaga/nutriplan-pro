// @ts-nocheck

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
        // Try to get key from both possible names
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY');

        if (!apiKey) {
            console.error('API Key not found in environment (checked GEMINI_API_KEY and VITE_GEMINI_API_KEY)');
            return new Response(JSON.stringify({ error: 'Configuração da IA incompleta no servidor. Verifique as chaves no Supabase.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'Texto da receita é obrigatório.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const prompt = `
Analise o texto da receita abaixo e extraia os detalhes.
Force a resposta a ser APENAS um JSON puro, sem explicações ou markdown, usando este esquema EXATO:
{
  "name": "nome da receita",
  "instructions": "passo a passo detalhado",
  "ingredients": [
    { "item": "nome do ingrediente", "quantidade": number, "unidade": "unidade", "calorias": number }
  ]
}

O campo "calorias" deve ser o TOTAL para a quantidade especificada de cada ingrediente.
Se o nome não estiver claro, crie um nome apropriado.
Se não houver instruções, deixe o campo "instructions" em branco.

TEXTO DA RECEITA:
${text}
`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!geminiRes.ok) {
            const errorMsg = await geminiRes.text();
            console.error('Gemini API Error:', errorMsg);
            throw new Error(`Erro na API do Gemini: ${geminiRes.statusText}`);
        }

        const result = await geminiRes.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error("A IA não retornou uma resposta válida.");
        }

        // Clean text if AI includes markdown blocks
        const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let aiData;
        try {
            aiData = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse AI response:", rawText);
            throw new Error("Falha ao analisar resposta da IA.");
        }

        if (!aiData.ingredients || !Array.isArray(aiData.ingredients)) {
            throw new Error("Resposta da IA não contém uma lista de ingredientes válida.");
        }

        const ingredients = aiData.ingredients.map((item: any) => ({
            name: item.item,
            quantity: item.quantidade,
            unit: item.unidade,
            caloriesPerUnit: item.quantidade > 0 ? (item.calorias / item.quantidade) * 100 : item.calorias,
            totalCalories: item.calorias
        }));

        const totalCalories = ingredients.reduce((sum: number, ing: any) => sum + ing.totalCalories, 0);

        const extractedRecipe = {
            name: aiData.name || "Nova Receita",
            ingredients,
            totalCalories,
            instructions: aiData.instructions || ""
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
