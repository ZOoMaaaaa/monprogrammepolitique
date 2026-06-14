import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) setError(error.message)
  }

  return (
    <div className="login-page">
      <h1>Nouveau mot de passe</h1>
      <p>Choisis un nouveau mot de passe pour ton compte.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            placeholder="6 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
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

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </div>
  )
}
