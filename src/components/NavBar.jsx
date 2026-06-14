import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'

export default function NavBar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const level = getLevel(profile?.elo ?? 1000)

  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => navigate('/')}>
        <img src="/logomonprogrammepolitique.PNG" className="navbar-logo" alt="" />
        <span>Mon Programme</span>
      </button>

      <div className="navbar-center">
        <button className="navbar-link" onClick={() => navigate('/')}>Accueil</button>
        <button className="navbar-link" onClick={() => navigate('/classement')}>Classement</button>
        <button className="navbar-link" onClick={() => navigate('/regles')}>Règles</button>
      </div>

      <div className="navbar-right">
        {profile && (
          <>
            <div className="navbar-level">{level.title}</div>
            <button className="navbar-avatar" onClick={() => navigate('/')}>
              <span>{profile.username}</span>
            </button>
            <button className="navbar-logout" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
