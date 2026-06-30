import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'
import { CAT_COLORS } from '../lib/categories'

const SIDE_COLOR = { left: 'var(--bleu)', right: 'var(--rouge)' }

export default function Duel() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [pair, setPair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [result, setResult] = useState(null)
  const [voteError, setVoteError] = useState(null)
  const [exhausted, setExhausted] = useState(false)
  const resultRef = useRef(null)

  const fetchPair = useCallback(async () => {
    setLoading(true)
    setResult(null)

    const { data: programs } = await supabase
      .from('programs')
      .select('id, user_id, profiles(username, slogan, elo, avatar_url), program_points(order, category, title, ai_context)')
      .eq('status', 'approved')
      .neq('user_id', profile.id)

    if (!programs || programs.length < 2) {
      setExhausted(true)
      setLoading(false)
      return
    }

    const { data: voted } = await supabase
      .from('duels')
      .select('program_1_id, program_2_id')
      .eq('voter_id', profile.id)

    const votedSet = new Set((voted ?? []).map((d) => key(d.program_1_id, d.program_2_id)))

    const ids = programs.map((p) => p.id)
    const shuffled = ids.sort(() => Math.random() - 0.5)

    let found = null
    outer: for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        if (!votedSet.has(key(shuffled[i], shuffled[j]))) {
          found = [
            programs.find((p) => p.id === shuffled[i]),
            programs.find((p) => p.id === shuffled[j]),
          ]
          break outer
        }
      }
    }

    if (!found) {
      setExhausted(true)
    } else {
      setPair(found)
    }
    setLoading(false)
  }, [profile.id])

  useEffect(() => { fetchPair() }, [fetchPair])

  async function vote(winnerId) {
    if (voting) return
    setVoting(true)
    setVoteError(null)

    const [p1, p2] = pair
    const { data, error } = await supabase.rpc('record_duel', {
      p_program_1_id: p1.id,
      p_program_2_id: p2.id,
      p_winner_id: winnerId,
    })

    if (error) {
      setVoteError(error.message)
    } else {
      await refreshProfile()
      setResult({ winnerId, eloChange: data })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }
    setVoting(false)
  }

  if (loading) {
    return (
      <div className="duel-page">
        <p className="duel-loading">Recherche d'un duel...</p>
      </div>
    )
  }

  if (exhausted) {
    return (
      <div className="duel-page duel-exhausted">
        <h2>Tu as tout vu !</h2>
        <p>Il n'y a plus de nouveaux programmes à comparer. Reviens plus tard.</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    )
  }

  const [p1, p2] = pair

  return (
    <div className="duel-page">
      <div className="duel-hero">
        <h1>Qui a le meilleur programme ?</h1>
        <p>Choisissez le programme qui vous convainc le plus</p>
      </div>

      <div className="duel-match">
        <div className="duel-arena">
          <ProgramCard
            program={p1}
            side="left"
            onVote={() => vote(p1.id)}
            disabled={voting || !!result}
            isWinner={result?.winnerId === p1.id}
            isLoser={result && result.winnerId !== p1.id}
          />

          <div className="vs-badge">VS</div>

          <ProgramCard
            program={p2}
            side="right"
            onVote={() => vote(p2.id)}
            disabled={voting || !!result}
            isWinner={result?.winnerId === p2.id}
            isLoser={result && result.winnerId !== p2.id}
          />
        </div>

        <div className="duel-contexts">
          <AiContext program={p1} />
          <div className="duel-contexts-spacer" />
          <AiContext program={p2} />
        </div>
      </div>

      {voteError && (
        <p className="error" style={{ textAlign: 'center' }}>Erreur : {voteError}</p>
      )}

      {result && (
        <div className="duel-result" ref={resultRef}>
          <p>Vote enregistré ! <strong>±{result.eloChange} pts de popularité</strong> échangés.</p>
          <button onClick={fetchPair}>Duel suivant →</button>
        </div>
      )}
    </div>
  )
}

function ProgramCard({ program, side, onVote, disabled, isWinner, isLoser }) {
  const { profiles: p } = program
  const level = getLevel(p?.elo ?? 1000)
  const points = [...(program.program_points ?? [])].sort((a, b) => a.order - b.order)
  const color = SIDE_COLOR[side]

  return (
    <div className={`duel-card ${side} ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`}>
      {isWinner && <div className="verdict winner-label">Vainqueur ✓</div>}
      {isLoser && <div className="verdict loser-label">Perdant</div>}

      <div className="duel-card-candidate">
        <div className="duel-candidate-info">
          <strong className="duel-name">{p?.username}</strong>
          {p?.slogan && <span className="duel-slogan">« {p.slogan} »</span>}
          <span className="level-badge">{level.title}</span>
        </div>
      </div>

      <ul className="duel-points">
        {points.map((pt) => {
          const catColor = CAT_COLORS[pt.category] ?? color
          return (
            <li key={pt.order} className="duel-point-row">
              <span className="duel-cat-dot" style={{ background: catColor }} />
              <div className="duel-point-text">
                <span className="category" style={{ color: catColor }}>{pt.category}</span>
                <span>{pt.title}</span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="duel-card-actions">
        <button
          className={`duel-vote-btn ${side}`}
          onClick={onVote}
          disabled={disabled}
        >
          Je choisis {p?.username}
        </button>
      </div>
    </div>
  )
}

function AiContext({ program }) {
  const points = [...(program.program_points ?? [])].sort((a, b) => a.order - b.order)
  const spotlight = points.find((pt) => pt.ai_context && pt.ai_context.trim() !== '')
  if (!spotlight) return <div className="ai-context-card ai-context-empty" />
  return (
    <div className="ai-context-card">
      <span className="ai-context-label">Exemple mondial · {spotlight.category}</span>
      <p className="ai-context-reform">« {spotlight.title} »</p>
      <p className="ai-context-text">{spotlight.ai_context}</p>
    </div>
  )
}

function key(a, b) {
  return [a, b].sort().join(':')
}
