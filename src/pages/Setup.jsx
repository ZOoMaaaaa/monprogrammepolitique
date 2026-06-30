import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Setup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [slogan, setSlogan] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!age || !gender) {
      setError("L'âge et le sexe sont obligatoires.")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, slogan, age: parseInt(age), gender, setup_complete: true })
      .eq('id', user.id)

    if (error) {
      setError(error.message.includes('unique') ? 'Ce pseudo est déjà pris.' : error.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="setup-page">
      <div className="setup-topbar">
        <button
          type="button"
          className="setup-logout"
          onClick={() => supabase.auth.signOut()}
        >
          Déconnexion
        </button>
      </div>

      <h1>Crée ton profil de candidat</h1>
      <p>Tu n'as besoin de faire ça qu'une seule fois.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Ton pseudo</label>
          <input
            type="text"
            placeholder="ex : JeanDupont2027"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            required
          />
        </div>

        <div className="field">
          <label>Ton slogan de campagne <span>(optionnel)</span></label>
          <input
            type="text"
            placeholder="ex : Pour un avenir meilleur"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="field">
          <label>Âge</label>
          <input
            type="number"
            placeholder="ex : 28"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={13}
            max={120}
            required
          />
        </div>

        <div className="field">
          <label>Sexe</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="">— Sélectionne —</option>
            <option>Homme</option>
            <option>Femme</option>
            <option>Autre</option>
            <option>Préfère ne pas préciser</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Créer mon profil'}
        </button>
      </form>
    </div>
  )
}
