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
        // Support both OpenAI and generic AI key names
        const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY');

        if (!apiKey) {
            console.error('AI API Key not found in environment');
            return new Response(JSON.stringify({ error: 'Configuração da IA incompleta no servidor. Verifique as chaves (OPENAI_API_KEY) no Supabase.' }), {
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

        // Use OpenAI GPT-5-nano as requested
        const openAiKey = Deno.env.get('OPENAI_API_KEY') || apiKey; // Fallback to provided key if environment not set
        const apiUrl = 'https://api.openai.com/v1/responses';

        const openAiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-5-nano',
                input: prompt,
                store: true
            })
        });

        if (!openAiRes.ok) {
            const errorMsg = await openAiRes.text();
            console.error('OpenAI API Error:', errorMsg);
            throw new Error(`Erro na API da OpenAI: ${openAiRes.statusText}`);
        }

        const result = await openAiRes.json();
        const rawText = result.output_text; // Using output_text as per user example

        if (!rawText) {
            console.error("OpenAI result structure:", result);
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
