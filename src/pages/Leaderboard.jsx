import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('global')
  const [rows, setRows] = useState([])
  const [friends, setFriends] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Recherche manuelle d'ami
  const [friendSearch, setFriendSearch] = useState('')
  const [friendResults, setFriendResults] = useState([])
  const [friendSearching, setFriendSearching] = useState(false)

  const fetchFriends = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', profile.id)
    setFriends(new Set((data ?? []).map((f) => f.friend_id)))
  }, [profile.id])

  const fetchGlobal = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, elo, duels_played, duels_won, slogan')
      .eq('setup_complete', true)
      .eq('is_banned', false)
      .order('elo', { ascending: false })
      .limit(100)
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchGlobal(), fetchFriends()]).then(() => setLoading(false))
  }, [fetchGlobal, fetchFriends])

  async function searchFriend() {
    if (!friendSearch.trim()) return
    setFriendSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, elo')
      .eq('setup_complete', true)
      .eq('is_banned', false)
      .ilike('username', `%${friendSearch.trim()}%`)
      .neq('id', profile.id)
      .limit(5)
    setFriendResults(data ?? [])
    setFriendSearching(false)
  }

  async function addFriend(friendId) {
    await supabase.from('friendships').insert({ user_id: profile.id, friend_id: friendId })
    setFriends((prev) => new Set([...prev, friendId]))
  }

  async function removeFriend(friendId) {
    await supabase.from('friendships').delete().eq('user_id', profile.id).eq('friend_id', friendId)
    setFriends((prev) => { const s = new Set(prev); s.delete(friendId); return s })
  }

  const globalFiltered = rows.filter((r) =>
    r.username.toLowerCase().includes(search.toLowerCase())
  )

  const friendRows = rows
    .filter((r) => r.id === profile.id || friends.has(r.id))
    .sort((a, b) => b.elo - a.elo)

  const displayRows = tab === 'global' ? globalFiltered : friendRows
  const userRank = rows.findIndex((r) => r.id === profile.id) + 1

  return (
    <div className="leaderboard-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Accueil</button>

      <div className="leaderboard-hero">
        <h1>Classement</h1>
        <p>Ta position : <strong>#{userRank || '—'}</strong> sur {rows.length} candidats</p>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'global' ? 'active' : ''} onClick={() => setTab('global')}>
          🌍 Top 100
        </button>
        <button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>
          👥 Amis {friends.size > 0 && <span className="badge">{friends.size}</span>}
        </button>
      </div>

      {tab === 'global' && (
        <input
          className="search-input"
          type="text"
          placeholder="Rechercher un candidat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {tab === 'friends' && (
        <div className="friend-add-block">
          <div className="friend-search-row">
            <input
              className="search-input"
              type="text"
              placeholder="Rechercher un ami par pseudo..."
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchFriend()}
            />
            <button className="friend-search-btn" onClick={searchFriend} disabled={friendSearching}>
              {friendSearching ? '…' : 'Rechercher'}
            </button>
          </div>

          {friendResults.length > 0 && (
            <div className="friend-results">
              {friendResults.map((r) => (
                <div key={r.id} className="friend-result-row">
                  <span className="friend-result-name">{r.username}</span>
                  <span className="friend-result-elo">{r.elo} pts</span>
                  {friends.has(r.id) ? (
                    <button className="friend-btn remove" onClick={() => removeFriend(r.id)}>Retirer</button>
                  ) : (
                    <button className="friend-btn add" onClick={() => { addFriend(r.id); setFriendResults([]) }}>+ Ami</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {friendResults.length === 0 && friendSearch && !friendSearching && (
            <p className="empty" style={{ padding: '12px 0' }}>Aucun utilisateur trouvé.</p>
          )}
        </div>
      )}

      {tab === 'friends' && friendRows.length <= 1 && friendResults.length === 0 && (
        <div className="friends-empty">
          <p>Tu n'as pas encore d'amis. Recherche un pseudo ci-dessus ou trouve des candidats dans le <button onClick={() => setTab('global')}>Top 100</button> !</p>
        </div>
      )}

      {loading ? (
        <p className="empty">Chargement...</p>
      ) : (
        <div className="leaderboard-list">
          {displayRows.map((row, i) => {
            const rank = tab === 'global'
              ? rows.findIndex((r) => r.id === row.id) + 1
              : i + 1
            const level = getLevel(row.elo)
            const isMe = row.id === profile.id
            const isFriend = friends.has(row.id)

            return (
              <div key={row.id} className={`leaderboard-row ${isMe ? 'is-me' : ''}`}>
                <div className="rank">
                  {MEDAL[rank] ?? <span className="rank-num">#{rank}</span>}
                </div>

                <div className="row-info">
                  <div className="row-name">
                    <button className="username-link" onClick={() => navigate(`/profil/${row.id}`)}>
                      {row.username}
                    </button>
                    {isMe && <span className="me-badge">Moi</span>}
                  </div>
                  <span className="row-level">{level.title}</span>
                </div>

                <div className="row-elo">
                  <span className="elo-value">{row.elo}</span>
                  <span className="elo-label">Popularité</span>
                </div>

                {!isMe && (
                  isFriend ? (
                    <button className="friend-btn remove" onClick={() => removeFriend(row.id)}>
                      Retirer
                    </button>
                  ) : (
                    <button className="friend-btn add" onClick={() => addFriend(row.id)}>
                      + Ami
                    </button>
                  )
                )}
              </div>
            )
          })}

          {displayRows.length === 0 && <p className="empty">Aucun résultat.</p>}
        </div>
      )}
    </div>
  )
}
