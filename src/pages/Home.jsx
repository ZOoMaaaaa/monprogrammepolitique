import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel, LEVELS } from '../lib/levels'

const STATUS_LABELS = {
  pending:  { label: 'En attente de modération', className: 'pending' },
  approved: { label: 'Approuvé', className: 'approved' },
  rejected: { label: 'Refusé', className: 'rejected' },
}

const CAT_COLORS = {
  'Économie':      '#f59e0b',
  'Éducation':     '#3b82f6',
  'Environnement': '#16a34a',
  'Santé':         '#e11d48',
  'Sécurité':      '#6366f1',
  'Société':       '#0891b2',
}

function LevelProgress({ elo }) {
  const current = getLevel(elo)
  const nextLevel = LEVELS.find((l) => l.level === current.level + 1)

  if (!nextLevel) {
    return (
      <div className="level-progress">
        <div className="level-progress-label">
          <span className="level-title">{current.title}</span>
          <span className="level-max">Niveau maximum atteint 🏆</span>
        </div>
      </div>
    )
  }

  const from = current.minElo
  const to = nextLevel.minElo
  const pct = Math.round(((elo - from) / (to - from)) * 100)

  return (
    <div className="level-progress">
      <div className="level-progress-label">
        <span className="level-title">{current.title}</span>
        <span className="level-next">→ {nextLevel.title} ({to - elo} pts)</span>
      </div>
      <div className="level-bar-track">
        <div className="level-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [programOpen, setProgramOpen] = useState(false)

  useEffect(() => {
    async function fetchProgram() {
      const { data } = await supabase
        .from('programs')
        .select('id, status, rejection_reason, program_points(order, category, title)')
        .eq('user_id', profile.id)
        .single()
      setProgram(data)
      setLoading(false)
    }
    fetchProgram()
  }, [profile.id])

  if (loading) return null

  const points = [...(program?.program_points ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="home-page">
      <div className="home-intro">
        <p className="home-intro-label">Plateforme citoyenne participative</p>
        <h2 className="home-intro-title">La démocratie,<br />c'est toi.</h2>
        <p className="home-intro-text">
          Présente ton programme en 6 propositions, affronte les autres candidats en duel
          et grimpe dans le classement national.
        </p>
      </div>

      {/* Affiche candidat */}
      <div className="campaign-hero">
        <h1 className="campaign-name">{profile.username}</h1>
        {profile.slogan && <p className="campaign-slogan">« {profile.slogan} »</p>}

        <div className="campaign-stats">
          <div className="campaign-stat">
            <span className="campaign-stat-val">{profile.elo}</span>
            <span className="campaign-stat-lbl">Popularité</span>
          </div>
          <div className="campaign-stat-divider" />
          <div className="campaign-stat">
            <span className="campaign-stat-val">{profile.duels_played}</span>
            <span className="campaign-stat-lbl">Duels</span>
          </div>
          <div className="campaign-stat-divider" />
          <div className="campaign-stat">
            <span className="campaign-stat-val">{profile.duels_won}</span>
            <span className="campaign-stat-lbl">Victoires</span>
          </div>
          <div className="campaign-stat-divider" />
          <div className="campaign-stat">
            <span className="campaign-stat-val">{profile.vote_points ?? 0}</span>
            <span className="campaign-stat-lbl">Votes</span>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <LevelProgress elo={profile.elo} />
        </div>
      </div>

      {/* Bouton duel remonté */}
      {program?.status === 'approved' && (
        <button className="duel-btn" onClick={() => navigate('/duel')}>
          ⚔️ Participer aux duels
        </button>
      )}

      {/* Motif de refus */}
      {program?.status === 'rejected' && program.rejection_reason && (
        <div className="rejection-banner">
          <strong>Programme refusé —</strong> {program.rejection_reason}
        </div>
      )}

      {/* Programme accordéon */}
      <div className="accordion">
        <button className="accordion-header" onClick={() => setProgramOpen((o) => !o)}>
          <div className="accordion-title">
            <h2>Mon programme</h2>
            {program && (
              <span className={`status-badge ${STATUS_LABELS[program.status].className}`}>
                {STATUS_LABELS[program.status].label}
              </span>
            )}
          </div>
          <div className="accordion-right">
            {program?.status === 'rejected' && (
              <button
                className="edit-btn"
                onClick={(e) => { e.stopPropagation(); navigate('/programme/modifier') }}
              >
                Modifier
              </button>
            )}
            <span className="accordion-chevron">{programOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {programOpen && (
          <div className="accordion-body">
            {!program ? (
              <div className="no-program">
                <div className="no-program-icon">📋</div>
                <h2>Aucun programme</h2>
                <p>Présente tes 6 propositions et entre dans l'arène !</p>
                <button onClick={() => navigate('/programme/creer')}>
                  Rédiger mon programme
                </button>
              </div>
            ) : (
              <>
                <ol className="campaign-points">
                  {points.map((pt, i) => (
                    <li key={pt.order} className="campaign-point">
                      <span
                        className="campaign-num"
                        style={{ color: CAT_COLORS[pt.category] ?? 'var(--bleu)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="campaign-point-body">
                        <span
                          className="category"
                          style={{ color: CAT_COLORS[pt.category] ?? 'var(--bleu)' }}
                        >
                          {pt.category}
                        </span>
                        <strong>{pt.title}</strong>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>

      {profile.is_admin && (
        <button className="admin-link" onClick={() => navigate('/admin')}>
          🛡️ Panel de modération
        </button>
      )}
    </div>
  )
}
