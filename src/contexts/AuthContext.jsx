import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const [guest, setGuest] = useState(() => sessionStorage.getItem('guest') === '1')

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  function continueAsGuest() {
    sessionStorage.setItem('guest', '1')
    setGuest(true)
  }

  function exitGuest() {
    sessionStorage.removeItem('guest')
    setGuest(false)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!active) return
        const u = session?.user ?? null
        setUser(u)
        if (u) { exitGuest(); await fetchProfile(u.id) }
        if (active) setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
        return
      }
      if (event === 'USER_UPDATED') {
        setIsRecovery(false)
      }
      const u = session?.user ?? null
      setUser(u)
      // Ne PAS appeler de requête supabase (await) directement dans ce callback :
      // cela peut bloquer le verrou interne d'auth-js et laisser une page blanche
      // au démarrage. On diffère le chargement du profil hors du callback.
      setTimeout(() => {
        if (!active) return
        if (u) { exitGuest(); fetchProfile(u.id) }
        else setProfile(null)
      }, 0)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, isRecovery, guest, continueAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
