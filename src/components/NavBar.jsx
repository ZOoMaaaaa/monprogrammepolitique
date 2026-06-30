import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getLevel } from '../lib/levels'

export default function NavBar() {
  const { profile, guest, exitGuest } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const level = getLevel(profile?.elo ?? 1000)

  function go(path) {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => go('/')}>
        <img src="/logomonprogrammepolitique.PNG" className="navbar-logo" alt="" />
        <span>Mon Programme</span>
      </button>

      <div className="navbar-center">
        <button className="navbar-link" onClick={() => go('/')}>Accueil</button>
        <button className="navbar-link" onClick={() => go('/duel')}>Duels</button>
        <button className="navbar-link" onClick={() => go('/classement')}>Classement</button>
        <button className="navbar-link" onClick={() => go('/regles')}>Règles</button>
      </div>

      <div className="navbar-right">
        {profile && (
          <>
            <div className="navbar-level">{level.title}</div>
            <button className="navbar-avatar" onClick={() => go(`/profil/${profile.id}`)}>
              <span>{profile.username}</span>
            </button>
            <button className="navbar-logout" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </button>
          </>
        )}
        {guest && (
          <button className="navbar-login" onClick={exitGuest}>
            Se connecter
          </button>
        )}
        <button
          className="navbar-burger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <button className="navbar-mobile-link" onClick={() => go('/')}>Accueil</button>
          <button className="navbar-mobile-link" onClick={() => go('/duel')}>Duels</button>
          <button className="navbar-mobile-link" onClick={() => go('/classement')}>Classement</button>
          <button className="navbar-mobile-link" onClick={() => go('/regles')}>Règles</button>
          {profile && (
            <button className="navbar-mobile-link" onClick={() => go(`/profil/${profile.id}`)}>Mon profil</button>
          )}
          {guest && (
            <button className="navbar-mobile-link" onClick={() => { setMenuOpen(false); exitGuest() }}>
              Se connecter
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
