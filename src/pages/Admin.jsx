import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [programs, setPrograms] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState({})
  const [confirmBan, setConfirmBan] = useState(null)
  const [confirmReset, setConfirmReset] = useState(null)
  const [tab, setTab] = useState('moderation')
  const [search, setSearch] = useState('')
  const [aiNotice, setAiNotice] = useState(null)

  useEffect(() => {
    Promise.all([fetchPending(), fetchUsers()]).then(() => setLoading(false))
  }, [])

  async function fetchPending() {
    const { data } = await supabase
      .from('programs')
      .select(`
        id, status, created_at,
        profiles (id, username, slogan),
        program_points (order, category, title)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setPrograms(data ?? [])
  }


  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, slogan, is_banned, created_at')
      .eq('setup_complete', true)
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
  }

  async function approve(id) {
    await supabase.from('programs').update({ status: 'approved', rejection_reason: null }).eq('id', id)
    setPrograms((prev) => prev.filter((p) => p.id !== id))
    setAiNotice({ type: 'info', text: 'Programme approuvé. Génération du contexte IA en cours…' })

    const { data, error } = await supabase.functions.invoke('generate-ai-context', { body: { program_id: id } })

    if (error) {
      console.error('generate-ai-context a échoué :', error)
      setAiNotice({
        type: 'error',
        text: `Programme approuvé, mais la génération du contexte IA a échoué : ${error.message ?? error}. Vérifie que la fonction « generate-ai-context » est déployée et que la clé Groq est valide.`,
      })
      return
    }

    const ok = (data?.results ?? []).filter((r) => r.ok && r.hasExample !== false).length
    const total = (data?.results ?? []).length
    console.log('generate-ai-context résultat :', data)
    setAiNotice({
      type: 'success',
      text: `Programme approuvé. Contexte IA généré pour ${ok}/${total || '?'} réforme(s).`,
    })
  }

  async function reject(program) {
    await supabase
      .from('programs')
      .update({ status: 'rejected', rejection_reason: rejectionReason[program.id] ?? null })
      .eq('id', program.id)
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
  }

  async function ban(program) {
    const userId = program.profiles?.id
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
    await supabase.from('programs').delete().eq('id', program.id)
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: true } : u))
    setConfirmBan(null)
  }

  async function resetUsername(userId) {
    await supabase
      .from('profiles')
      .update({ username: '', setup_complete: false })
      .eq('id', userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setConfirmReset(null)
  }

  if (loading) return <p>Chargement...</p>

  return (
    <div className="admin-page">
      <button className="back-btn" onClick={() => window.history.back()}>← Accueil</button>
      <h1>Administration</h1>

      <div className="admin-tabs">
        <button className={tab === 'moderation' ? 'active' : ''} onClick={() => setTab('moderation')}>
          Modération {programs.length > 0 && <span className="badge">{programs.length}</span>}
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Utilisateurs
        </button>
      </div>

      {tab === 'moderation' && (
        <div className="program-list">
          {aiNotice && (
            <p className={aiNotice.type === 'error' ? 'error' : aiNotice.type === 'success' ? 'success' : 'empty'}>
              {aiNotice.text}
            </p>
          )}
          {programs.length === 0
            ? <p className="empty">Aucun programme en attente.</p>
            : <p>{programs.length} programme(s) en attente de validation.</p>
          }
          {programs.map((p) => {
            const points = [...(p.program_points ?? [])].sort((a, b) => a.order - b.order)
            return (
              <div key={p.id} className="program-card">
                <div className="program-header">
                  <strong>{p.profiles?.username}</strong>
                  {p.profiles?.slogan && <em>« {p.profiles.slogan} »</em>}
                  <span className="date">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                <ol className="points-list">
                  {points.map((pt) => (
                    <li key={pt.order}>
                      <span className="category">{pt.category}</span>
                      <strong>{pt.title}</strong>
                    </li>
                  ))}
                </ol>

                <div className="moderation-actions">
                  <button className="approve" onClick={() => approve(p.id)}>
                    Approuver
                  </button>

                  <div className="reject-group">
                    <button
                      className="reject"
                      disabled={!rejectionReason[p.id]?.trim()}
                      onClick={() => reject(p)}
                    >
                      Refuser
                    </button>
                    <textarea
                      placeholder="Motif de refus obligatoire..."
                      value={rejectionReason[p.id] ?? ''}
                      onChange={(e) => setRejectionReason((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {confirmReset === p.profiles?.id ? (
                    <div className="reset-confirm">
                      <span>Réinitialiser le pseudo de <strong>{p.profiles?.username}</strong> ?</span>
                      <button className="ban" onClick={() => resetUsername(p.profiles?.id)}>Confirmer</button>
                      <button className="cancel" onClick={() => setConfirmReset(null)}>Annuler</button>
                    </div>
                  ) : (
                    <button className="reset-btn" onClick={() => setConfirmReset(p.profiles?.id)}>
                      Réinitialiser le pseudo
                    </button>
                  )}

                  {confirmBan === p.id ? (
                    <div className="ban-confirm">
                      <span>Bannir définitivement <strong>{p.profiles?.username}</strong> ?</span>
                      <button className="ban" onClick={() => ban(p)}>Confirmer le ban</button>
                      <button className="cancel" onClick={() => setConfirmBan(null)}>Annuler</button>
                    </div>
                  ) : (
                    <button className="ban-trigger" onClick={() => setConfirmBan(p.id)}>
                      Bannir l'utilisateur
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'users' && (
        <div className="users-list">
          <input
            type="text"
            placeholder="Rechercher un pseudo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {users.filter((u) => u.username?.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <p className="empty">Aucun utilisateur trouvé.</p>
          )}
          {users.filter((u) => u.username?.toLowerCase().includes(search.toLowerCase())).map((u) => (
            <div key={u.id} className={`user-row ${u.is_banned ? 'banned' : ''}`}>
              <div className="user-info">
                <strong>{u.username || <em>pseudo vide</em>}</strong>
                {u.slogan && <span>« {u.slogan} »</span>}
                {u.is_banned && <span className="status-badge rejected">Banni</span>}
              </div>

              {!u.is_banned && (
                confirmReset === u.id ? (
                  <div className="reset-confirm">
                    <span>Réinitialiser le pseudo de <strong>{u.username}</strong> ?</span>
                    <button className="ban" onClick={() => resetUsername(u.id)}>Confirmer</button>
                    <button className="cancel" onClick={() => setConfirmReset(null)}>Annuler</button>
                  </div>
                ) : (
                  <button className="reset-btn" onClick={() => setConfirmReset(u.id)}>
                    Réinitialiser le pseudo
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
