import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rpxtsctzwutydlurstvj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweHRzY3R6d3V0eWRsdXJzdHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDE2MTksImV4cCI6MjA5NjQ3NzYxOX0.mLM859WyjVksSvRnZjRonxUO8eMJIqzxFaFPP9auK-0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data: programs, error } = await supabase
  .from('programs')
  .select('id, program_points(id, ai_context)')
  .eq('status', 'approved')

if (error) {
  console.error('Erreur lors de la récupération des programmes :', error.message)
  process.exit(1)
}

const toProcess = programs.filter((p) =>
  p.program_points.some((pt) => !pt.ai_context)
)

console.log(`${programs.length} programmes approuvés, ${toProcess.length} à traiter.`)

for (let i = 0; i < toProcess.length; i++) {
  const program = toProcess[i]
  process.stdout.write(`[${i + 1}/${toProcess.length}] Programme ${program.id} ... `)
  const { data, error: fnError } = await supabase.functions.invoke('generate-ai-context', {
    body: { program_id: program.id },
  })
  if (fnError) {
    console.log(`ERREUR : ${fnError.message}`)
  } else {
    const ok = data?.results?.filter((r) => r.ok).length ?? 0
    const fail = data?.results?.filter((r) => r.error).length ?? 0
    console.log(`${ok} OK, ${fail} erreurs`)
  }

  if (i < toProcess.length - 1) {
    process.stdout.write('  → attente 13s...\n')
    await new Promise((r) => setTimeout(r, 13000))
  }
}

console.log('Terminé.')
