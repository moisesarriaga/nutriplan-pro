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


        const prompt = `
Professional watercolor food illustration of A SINGLE PLATE of ready-to-eat ${recipeName}.
ONLY ONE PLATED DISH presentation, finished meal, viewed at a slight angle.
Delicate hand-painted watercolor style, soft organic brush strokes, visible paper texture, artistic and expressive.
Vibrant yet natural colors, subtle shading, painterly details.
Isolated on a clean white background.
NO photography, NO realism, NO 3D render.
NO pots, NO pans, NO raw ingredients, NO multiple dishes, NO multiple plates.
NO text, NO titles, NO labels.
Purely visual illustration, classic watercolor painting style.
`;

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
