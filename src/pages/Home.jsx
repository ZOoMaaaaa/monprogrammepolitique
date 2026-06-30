import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CAT_COLORS } from '../lib/categories'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Home() {
  const { user, guest, exitGuest } = useAuth()
  const navigate = useNavigate()

  const poolRef = useRef([])              // ids éligibles pas encore affichés
  const [poolCount, setPoolCount] = useState(0) // miroir de poolRef.length pour le rendu
  const [reforms, setReforms] = useState([]) // réformes déjà chargées (historique)
  const [index, setIndex] = useState(0)
  const [initLoading, setInitLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  async function loadReform(id) {
    const { data } = await supabase
      .from('program_points')
      .select('id, category, title, ai_context')
      .eq('id', id)
      .single()
    return data
  }

  useEffect(() => {
    async function init() {
      // On ne récupère que la liste d'identifiants : le contenu se charge au clic.
      const { data } = await supabase
        .from('program_points')
        .select('id, programs!inner(status)')
        .eq('programs.status', 'approved')
        .not('ai_context', 'is', null)
        .limit(500)

      const ids = shuffle((data ?? []).map((d) => d.id))
      if (ids.length) {
        const first = await loadReform(ids[0])
        poolRef.current = ids.slice(1)
        setPoolCount(poolRef.current.length)
        if (first) setReforms([first])
      }
      setInitLoading(false)
    }
    init()
  }, [])

  const current = reforms[index]
  const hasPrev = index > 0
  const hasNext = index < reforms.length - 1 || poolCount > 0

  function prev() {
    if (index > 0) setIndex(index - 1)
  }

  async function next() {
    // Déjà chargée dans l'historique : on avance sans refetch.
    if (index < reforms.length - 1) { setIndex(index + 1); return }
    if (fetching || poolRef.current.length === 0) return
    setFetching(true)
    const nextId = poolRef.current.shift()
    setPoolCount(poolRef.current.length)
    const r = await loadReform(nextId)
    setFetching(false)
    if (r) {
      setReforms((prevReforms) => [...prevReforms, r])
      setIndex(reforms.length)
    }
  }

  const color = current ? (CAT_COLORS[current.category] ?? 'var(--bleu)') : 'var(--bleu)'

  return (
    <div className="home-page">
      <div className="home-intro">
        <p className="home-intro-label">Plateforme citoyenne participative</p>
        <h2 className="home-intro-title">La démocratie,<br />c'est toi.</h2>
        <p className="home-intro-text">
          Découvre les réformes proposées par les candidats, vote en duel pour celles
          qui te convainquent, et grimpe dans le classement national.
        </p>

        <div className="home-cta-row">
          <button className="home-cta-primary" onClick={() => navigate('/duel')}>
            ⚔️ Participer aux duels
          </button>
          {user ? (
            <button className="home-cta-secondary" onClick={() => navigate('/programme/creer')}>
              Rédiger mon programme
            </button>
          ) : guest ? (
            <button className="home-cta-secondary" onClick={exitGuest}>
              Créer un compte
            </button>
          ) : null}
        </div>
      </div>

      <div className="showcase-head">
        <h2>Quelques réformes proposées</h2>
        <p className="section-sub">Un aperçu anonyme des programmes des candidats, avec un éclairage de l'IA.</p>
      </div>

      {initLoading ? (
        <p className="empty">Chargement des réformes...</p>
      ) : !current ? (
        <p className="empty">Aucune réforme à présenter pour l'instant. Reviens bientôt !</p>
      ) : (
        <div className="reform-carousel">
          <button
            className="reform-carousel-arrow"
            aria-label="Précédent"
            onClick={prev}
            disabled={!hasPrev}
          >
            ‹
          </button>

          <div className="reform-example-card">
            <span className="category" style={{ color }}>{current.category}</span>
            <p className="reform-example-title">« {current.title} »</p>
            <div className="reform-example-ai">
              <span className="ai-context-label">Éclairage IA · Exemple mondial</span>
              <p className="ai-context-text">{current.ai_context}</p>
            </div>
          </div>

          <button
            className="reform-carousel-arrow"
            aria-label="Suivant"
            onClick={next}
            disabled={!hasNext || fetching}
          >
            {fetching ? '…' : '›'}
          </button>
        </div>
      )}
    </div>
  )
}
