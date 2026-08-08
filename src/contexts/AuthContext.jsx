import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Budget total d'attente au démarrage. Passé ce délai on arrête d'attendre
// Supabase et on affiche l'app : mieux vaut un écran de connexion qu'un écran
// de chargement qui s'éternise (verrou auth-js bloqué par un autre onglet,
// requête de refresh qui ne répond jamais, réseau coupé...).
const BOOT_TIMEOUT_MS = 3000
// Plancher laissé à une requête si la précédente a déjà mangé tout le budget :
// sans lui, un getSession lent condamnerait la requête profil à échouer.
const MIN_REQUEST_MS = 1000

class TimeoutError extends Error {}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(`${label} : délai dépassé`)), ms)
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}

// Un refresh token révoqué ou expiré reste stocké dans le localStorage et fait
// échouer TOUS les chargements suivants : on le repère pour purger la session.
function isStaleSessionError(error) {
  const text = `${error?.name ?? ''} ${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  return text.includes('refresh token')
    || text.includes('refresh_token')
    || text.includes('session_expired')
    || text.includes('invalid claim')
}

function purgeAuthStorage() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('sb-') && key.includes('-auth-token'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // localStorage indisponible (navigation privée, cookies bloqués)
  }
}

async function clearStoredSession() {
  // On vide le storage en premier : c'est instantané et garanti, même si le
  // signOut reste bloqué sur le verrou interne d'auth-js.
  purgeAuthStorage()
  try {
    await withTimeout(supabase.auth.signOut({ scope: 'local' }), MIN_REQUEST_MS, 'déconnexion')
  } catch {
    // Le storage est déjà propre, la session locale est perdue de toute façon.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [isRecovery, setIsRecovery] = useState(false)
  const [guest, setGuest] = useState(() => sessionStorage.getItem('guest') === '1')

  // Id du profil déjà chargé (ou en cours) : évite de recharger le profil à
  // chaque TOKEN_REFRESHED et de dupliquer la requête au démarrage.
  const loadedProfileId = useRef(null)

  async function fetchProfile(userId, timeoutMs = BOOT_TIMEOUT_MS) {
    loadedProfileId.current = userId
    setProfileError(null)
    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        timeoutMs,
        'profil',
      )
      if (error) throw error
      setProfile(data)
      if (!data) setProfileError('Profil introuvable.')
    } catch (error) {
      setProfile(null)
      setProfileError(
        error instanceof TimeoutError
          ? 'Le chargement de ton profil a pris trop de temps.'
          : (error?.message ?? 'Erreur inconnue.'),
      )
    } finally {
      setProfileReady(true)
    }
  }

  function resetProfile() {
    loadedProfileId.current = null
    setProfile(null)
    setProfileError(null)
    setProfileReady(true)
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

    async function bootstrap() {
      // Le budget est partagé entre la session et le profil : les deux requêtes
      // s'enchaînent, l'écran de chargement reste borné par BOOT_TIMEOUT_MS.
      const deadline = Date.now() + BOOT_TIMEOUT_MS
      const budget = () => Math.max(deadline - Date.now(), MIN_REQUEST_MS)

      let sessionUser = null
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          budget(),
          'session',
        )
        if (error) throw error
        sessionUser = data?.session?.user ?? null
      } catch (error) {
        // Token périmé : on nettoie pour que le prochain chargement reparte sain.
        // Purge synchrone uniquement, pour ne pas entamer le budget de démarrage.
        if (isStaleSessionError(error)) purgeAuthStorage()
        // Timeout ou réseau : on démarre en visiteur, onAuthStateChange
        // rattrapera la session si elle finit par arriver.
      }

      if (!active) return

      setUser(sessionUser)
      if (sessionUser) {
        exitGuest()
        if (loadedProfileId.current !== sessionUser.id) fetchProfile(sessionUser.id, budget())
      } else {
        resetProfile()
      }
      setLoading(false)
    }

    bootstrap()

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
      // L'état de la session est connu : on ne bloque plus l'affichage, même si
      // le getSession du bootstrap est encore en attente.
      setLoading(false)
      // Ne PAS appeler de requête supabase (await) directement dans ce callback :
      // cela peut bloquer le verrou interne d'auth-js et laisser une page blanche
      // au démarrage. On diffère le chargement du profil hors du callback.
      setTimeout(() => {
        if (!active) return
        if (u) {
          exitGuest()
          if (loadedProfileId.current !== u.id) fetchProfile(u.id)
        } else {
          resetProfile()
        }
      }, 0)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  async function signOut() {
    await clearStoredSession()
    setUser(null)
    resetProfile()
    setIsRecovery(false)
  }

  // Tant que la session (puis le profil de l'utilisateur connecté) n'est pas
  // résolue, l'app ne sait pas quoi afficher : c'est le seul état d'attente.
  const booting = loading || (!!user && !profileReady)

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      booting,
      profileError,
      refreshProfile,
      signOut,
      isRecovery,
      guest,
      continueAsGuest,
      exitGuest,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
