import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Banned from './pages/Banned'
import ProgramForm from './pages/ProgramForm'
import Duel from './pages/Duel'
import Leaderboard from './pages/Leaderboard'
import ProfilePage from './pages/ProfilePage'
import LegalPage from './pages/LegalPage'
import ResetPassword from './pages/ResetPassword'
import RulesPage from './pages/RulesPage'
import CookieBanner from './components/CookieBanner'

function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-spinner" />
      <p>Chargement…</p>
    </div>
  )
}

function ProfileErrorScreen({ message, onRetry, onSignOut }) {
  return (
    <div className="boot-screen">
      <h1>Connexion impossible</h1>
      <p>Ton compte est bien reconnu, mais ton profil n'a pas pu être chargé.</p>
      {message && <p className="boot-error">{message}</p>}
      <div className="boot-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>Réessayer</button>
        <button type="button" className="btn-ghost" onClick={onSignOut}>Se déconnecter</button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, booting, profileError, refreshProfile, signOut, isRecovery, guest } = useAuth()

  if (booting) return <BootScreen />

  if (isRecovery) {
    return <ResetPassword />
  }

  if (!user && guest) {
    return (
      <div className="app-layout">
        <img src="/mariannebleue.PNG" className="marianne-fixed left" alt="" />
        <img src="/mariannerouge.PNG" className="marianne-fixed right" alt="" />
        <NavBar />
        <main className="main-content app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/duel" element={<Duel />} />
            <Route path="/classement" element={<Leaderboard />} />
            <Route path="/regles" element={<RulesPage />} />
            <Route path="/profil/:id" element={<ProfilePage />} />
            <Route path="/legal/:section" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-layout">
        <main className="app-main">
          <Routes>
            <Route path="/legal/:section" element={<LegalPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </main>
        <Footer />
      </div>
    )
  }

  // Utilisateur connecté mais profil illisible (réseau, RLS, ligne manquante) :
  // surtout ne pas l'envoyer vers Setup, qui échouerait silencieusement.
  if (!profile) {
    return (
      <ProfileErrorScreen
        message={profileError}
        onRetry={refreshProfile}
        onSignOut={signOut}
      />
    )
  }

  if (profile?.is_banned) {
    return (
      <Routes>
        <Route path="*" element={<Banned />} />
      </Routes>
    )
  }

  if (!profile?.setup_complete) {
    return (
      <div className="app-layout">
        <main className="app-main">
          <Routes>
            <Route path="/legal/:section" element={<LegalPage />} />
            <Route path="*" element={<Setup />} />
          </Routes>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app-layout">
      <img src="/mariannebleue.PNG" className="marianne-fixed left" alt="" />
      <img src="/mariannerouge.PNG" className="marianne-fixed right" alt="" />
      <NavBar />
      <main className="main-content app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programme/creer" element={<ProgramForm />} />
          <Route path="/programme/modifier" element={<ProgramForm />} />
          <Route path="/duel" element={<Duel />} />
          <Route path="/classement" element={<Leaderboard />} />
          <Route path="/regles" element={<RulesPage />} />
          <Route path="/profil/:id" element={<ProfilePage />} />
          <Route path="/legal/:section" element={<LegalPage />} />
          {profile?.is_admin && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <CookieBanner />
      </BrowserRouter>
    </AuthProvider>
  )
}
