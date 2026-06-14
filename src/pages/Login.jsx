import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  function switchMode(m) {
    setMode(m)
    setError(null)
    setSuccess(null)
  }

  function handleParticipe() {
    setFlipped(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Un lien de réinitialisation a été envoyé à ton adresse email.')
      }
      setLoading(false)
      return
    }

    if (mode === 'register' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou mot de passe incorrect.')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Compte créé ! Tu peux maintenant te connecter.')
        switchMode('login')
        setPassword('')
        setConfirm('')
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className={`flip-card${flipped ? ' flipped' : ''}`}>
        <div className="flip-card-inner">

          {/* Face avant — présentation du site */}
          <div className="flip-card-face flip-card-front login-card">
            <div className="login-front-label">Mon Programme Politique</div>
            <h1 className="login-front-title">Si tu étais président…</h1>
            <p className="login-front-sub">
              Quelles seraient tes premières réformes ?<br />
              Affronte les autres candidats et monte dans les sondages.
            </p>

            <div className="login-front-hooks">
              <p>Rédige ton programme en 6 réformes.</p>
              <p>Affronte les autres candidats en duel.</p>
              <p>Monte dans les sondages et décroche la présidence.</p>
            </div>

            <button className="login-cta" onClick={handleParticipe}>
              Je participe →
            </button>
          </div>

          {/* Face arrière — formulaire */}
          <div className="flip-card-face flip-card-back login-card">
            <button type="button" className="flip-back-btn" onClick={() => setFlipped(false)}>
              ← Retour
            </button>

            <h1>Mon Programme Politique</h1>

            {mode !== 'forgot' && (
              <div className="login-tabs">
                <button
                  type="button"
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => switchMode('login')}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => switchMode('register')}
                >
                  Inscription
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="forgot-header">
                <button type="button" className="back-link" onClick={() => switchMode('login')}>
                  ← Retour à la connexion
                </button>
                <h2>Mot de passe oublié</h2>
                <p>Saisis ton adresse email pour recevoir un lien de réinitialisation.</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Adresse email</label>
                <input
                  type="email"
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div className="field">
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    placeholder="6 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {mode === 'register' && (
                <div className="field">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    placeholder="Répète ton mot de passe"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}

              <button type="submit" disabled={loading}>
                {loading ? '...' : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : 'Envoyer le lien'}
              </button>

              {mode === 'login' && (
                <button type="button" className="forgot-link" onClick={() => switchMode('forgot')}>
                  Mot de passe oublié ?
                </button>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
