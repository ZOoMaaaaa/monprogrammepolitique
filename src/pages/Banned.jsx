import { supabase } from '../lib/supabase'

export default function Banned() {
  return (
    <div className="banned-page">
      <h1>Compte banni</h1>
      <p>Ton compte a été banni définitivement suite à une violation de nos règles de modération.</p>
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </div>
  )
}
