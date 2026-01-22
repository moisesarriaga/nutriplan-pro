// @ts-nocheck
declare const Deno: any;
import OpenAI from "openai";

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
        if (!apiKey) {
            throw new Error('Chave de API "OpenAi-Gerador-Imagens" não encontrada no ambiente do Supabase.');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const { recipeName, recipeDescription } = await req.json();

        if (!recipeName) {
            return new Response(JSON.stringify({ error: 'Nome da receita é obrigatório.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Gerando imagem para: ${recipeName}`);

        const promptDescription = recipeDescription
            ? `. Description: ${recipeDescription.substring(0, 300)}...`
            : "";

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional high-quality food photography of ${recipeName}${promptDescription}, appetizing, studio lighting, top-down view or 45-degree angle, high resolution, culinary magazine style, vibrant colors.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });

        const imageUrl = response.data[0].url;

        return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error generating image:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
