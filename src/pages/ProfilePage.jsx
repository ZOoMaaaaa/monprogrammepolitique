import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'

export default function ProfilePage() {
  const { id } = useParams()
  const { profile: me } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [program, setProgram] = useState(null)
  const [isFriend, setIsFriend] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: prog }, { data: f }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, avatar_url, slogan, elo, duels_played, duels_won, vote_points')
          .eq('id', id)
          .single(),
        supabase
          .from('programs')
          .select('status, program_points(order, category, title)')
          .eq('user_id', id)
          .eq('status', 'approved')
          .single(),
        supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', me.id)
          .eq('friend_id', id)
          .maybeSingle(),
      ])
      setProfile(p)
      setProgram(prog)
      setIsFriend(!!f)
      setLoading(false)
    }
    load()
  }, [id, me.id])

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
  const isMe = profile.id === me.id
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

        {!isMe && (
          <button className="friend-toggle-btn" onClick={toggleFriend}>
            {isFriend ? '✓ Ami · Retirer' : '+ Ajouter en ami'}
          </button>
        )}
      </div>

      <div className="section-header">
        <h2>Son programme</h2>
      </div>

      {!program ? (
        <div className="no-program" style={{ padding: '32px' }}>
          <p>Cet utilisateur n'a pas encore de programme approuvé.</p>
        </div>
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
    </div>
  )
}
