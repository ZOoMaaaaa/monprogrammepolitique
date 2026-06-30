import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(key: string, prompt: string, attempt = 0): Promise<string | null> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    }),
  })

  const json = await res.json()

  if (res.status === 429 && attempt < 5) {
    const match = json.error?.message?.match(/try again in (\d+(?:\.\d+)?)s/)
    const delay = match ? Math.ceil(parseFloat(match[1])) * 1000 + 500 : 5000
    await new Promise((r) => setTimeout(r, delay))
    return callGroq(key, prompt, attempt + 1)
  }

  if (!res.ok) return null

  return json.choices?.[0]?.message?.content?.trim() ?? null
}

serve(async (req) => {
  try {
    const { program_id } = await req.json()

    const GROQ_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_KEY) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY manquant' }), { status: 500 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: points, error } = await supabase
      .from('program_points')
      .select('id, category, title')
      .eq('program_id', program_id)

    if (error || !points?.length) {
      return new Response(JSON.stringify({ error: 'Points not found', detail: error }), { status: 400 })
    }

    const results = []

    for (const point of points) {
      const prompt = `Voici une proposition de réforme politique en France.\nCatégorie : ${point.category}\nProposition : "${point.title}"\n\nEn 2 phrases maximum, cite un exemple concret d'un pays qui a mis en place une mesure similaire et ce qu'il s'est passé (succès, nuances, résultats). Sois factuel, neutre et précis. Réponds en français.\nSi aucun exemple concret et vérifiable n'existe, réponds EXACTEMENT par le mot NONE (en majuscules, sans rien d'autre).`

      const text = await callGroq(GROQ_KEY, prompt)

      if (text === null) {
        results.push({ id: point.id, error: 'Pas de réponse Groq' })
        continue
      }

      const cleaned = text.trim()
      const hasExample = cleaned !== '' && !/^['"]?none\b/i.test(cleaned)

      const { error: updateError } = await supabase
        .from('program_points')
        .update({ ai_context: hasExample ? cleaned : null })
        .eq('id', point.id)

      results.push({ id: point.id, ok: !updateError, hasExample, error: updateError?.message })
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
