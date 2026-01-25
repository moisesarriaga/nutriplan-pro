// @ts-nocheck
declare const Deno: any;
import OpenAI from "https://esm.sh/openai@4";

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
        const apiKey = Deno.env.get('OpenAi-Gerador-Imagens');
        console.log(`API Key encontrada: ${!!apiKey}`);

        if (!apiKey) {
            throw new Error('Chave de API "OpenAi-Gerador-Imagens" não encontrada no ambiente do Supabase.');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const { recipeName, recipeDescription } = await req.json();
        console.log(`Recebido request para: ${recipeName}`);

        if (!recipeName) {
            return new Response(JSON.stringify({ error: 'Nome da receita é obrigatório.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Iniciando geração de imagem no gpt-image-1...`);

        const promptDescription = recipeDescription
            ? `. Description: ${recipeDescription.substring(0, 300)}...`
            : "";

        const prompt = `Professional food illustration of ${recipeName}${promptDescription}. Delicate watercolor style, soft hand-painted textures, artistic brush strokes, vibrant colors, isolated on a clean white background. NO text, NO titles, NO labels, purely visual illustration.`;

        // Using the new gpt-image-1 model as per documentation
        const response = await openai.images.generate({
            model: "gpt-image-1",
            prompt: prompt,
            size: "1024x1024",
        });

        console.log(`Resposta da OpenAI:`, JSON.stringify(response));
        console.log(`Imagem gerada com sucesso!`);

        const imageUrl = response.data[0].url || `data:image/png;base64,${response.data[0].b64_json}`;

        return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('ERRO DETALHADO:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
