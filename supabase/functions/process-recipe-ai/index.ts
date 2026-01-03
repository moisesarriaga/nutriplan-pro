import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.0'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const { recipeText } = await req.json()

        if (!recipeText) {
            throw new Error('Recipe text is required')
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean the response to extract JSON
        let jsonText = text.trim()
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

        return new Response(
            jsonText,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error) {
        console.error('AI Error processing recipe:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: `AI Error: ${error.message || 'Unknown error during processing'}`,
                details: error.toString()
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})
