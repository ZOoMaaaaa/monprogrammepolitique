import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'
import LevelProgress from '../components/LevelProgress'

const STATUS_LABELS = {
  pending:  { label: 'En attente de modération', className: 'pending' },
  approved: { label: 'Approuvé', className: 'approved' },
  rejected: { label: 'Refusé', className: 'rejected' },
}

export default function ProfilePage() {
  const { id } = useParams()
  const { profile: me } = useAuth()
  const navigate = useNavigate()

  const viewingSelf = !!me && me.id === id

  const [profile, setProfile] = useState(null)
  const [program, setProgram] = useState(null)
  const [isFriend, setIsFriend] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let programQuery = supabase
        .from('programs')
        .select('status, rejection_reason, program_points(order, category, title)')
        .eq('user_id', id)
      // Sur un profil tiers, on ne montre que le programme approuvé.
      if (!viewingSelf) programQuery = programQuery.eq('status', 'approved')

      const [{ data: p }, { data: prog }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, avatar_url, slogan, elo, duels_played, duels_won, vote_points')
          .eq('id', id)
          .single(),
        programQuery.single(),
      ])
      setProfile(p)
      setProgram(prog)

      if (me?.id && !viewingSelf) {
        const { data: f } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', me.id)
          .eq('friend_id', id)
          .maybeSingle()
        setIsFriend(!!f)
      }
      setLoading(false)
    }
    load()
  }, [id, me?.id, viewingSelf])

  async function toggleFriend() {
    if (isFriend) {
      await supabase.from('friendships').delete().eq('user_id', me.id).eq('friend_id', id)
      setIsFriend(false)
    } else {
      await supabase.from('friendships').insert({ user_id: me.id, friend_id: id })
      setIsFriend(true)
    }
  }

  if (loading) return null
  if (!profile) return <div className="profile-page"><p className="empty">Utilisateur introuvable.</p></div>

  const level = getLevel(profile.elo)
  const points = [...(program?.program_points ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>

      <div className="candidate-card">
        <div className="candidate-card-top">
          <div className="candidate-info">
            <h1>{profile.username}</h1>
            {profile.slogan && <p className="slogan">« {profile.slogan} »</p>}
            <span className="level-badge" style={{ marginTop: 6, display: 'inline-block' }}>
              {level.title}
            </span>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-value">{profile.elo}</span>
            <span className="stat-label">Popularité</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.duels_played}</span>
            <span className="stat-label">Duels</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.duels_won}</span>
            <span className="stat-label">Victoires</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.vote_points ?? 0}</span>
            <span className="stat-label">Votes</span>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: 16 }}>
          <LevelProgress elo={profile.elo} />
        </div>

        {me && !viewingSelf && (
          <button className="friend-toggle-btn" onClick={toggleFriend}>
            {isFriend ? '✓ Ami · Retirer' : '+ Ajouter en ami'}
          </button>
        )}
      </div>

      {viewingSelf && program?.status === 'approved' && (
        <button className="duel-btn" onClick={() => navigate('/duel')}>
          ⚔️ Participer aux duels
        </button>
      )}

      {viewingSelf && program?.status === 'rejected' && program.rejection_reason && (
        <div className="rejection-banner">
          <strong>Programme refusé —</strong> {program.rejection_reason}
        </div>
      )}

      <div className="section-header">
        <div className="accordion-title">
          <h2>{viewingSelf ? 'Mon programme' : 'Son programme'}</h2>
          {viewingSelf && program && (
            <span className={`status-badge ${STATUS_LABELS[program.status].className}`}>
              {STATUS_LABELS[program.status].label}
            </span>
          )}
          {viewingSelf && program?.status === 'rejected' && (
            <button className="edit-btn" onClick={() => navigate('/programme/modifier')}>
              Modifier
            </button>
          )}
        </div>
      </div>

      {!program ? (
        viewingSelf ? (
          <div className="no-program" style={{ padding: '32px' }}>
            <div className="no-program-icon">📋</div>
            <h2>Aucun programme</h2>
            <p>Présente tes 6 propositions et entre dans l'arène !</p>
            <button onClick={() => navigate('/programme/creer')}>Rédiger mon programme</button>
          </div>
        ) : (
          <div className="no-program" style={{ padding: '32px' }}>
            <p>Cet utilisateur n'a pas encore de programme approuvé.</p>
          </div>
        )
      ) : (
        <div className="program-section">
          <ol className="points-list">
            {points.map((pt) => (
              <li key={pt.order}>
                <span className="point-num">{pt.order}</span>
                <div className="point-content">
                  <span className="category">{pt.category}</span>
                  <strong>{pt.title}</strong>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {viewingSelf && me?.is_admin && (
        <button className="admin-link" onClick={() => navigate('/admin')}>
          🛡️ Panel de modération
        </button>
      )}
    </div>
  )
}
