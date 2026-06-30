import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES, POINT_COUNT } from '../lib/categories'

const PLACEHOLDERS = [
  'ex : Revaloriser le SMIC de 15% d\'ici 2026',
  'ex : Rendre la cantine scolaire gratuite pour tous',
  'ex : Planter 1 milliard d\'arbres en 5 ans',
  'ex : Créer 10 000 postes d\'infirmiers en zones rurales',
  'ex : Doubler les effectifs de police de proximité',
  'ex : Légaliser le cannabis à usage récréatif',
]

const emptyPoint = (order) => ({
  order,
  category: CATEGORIES[(order - 1) % CATEGORIES.length],
  title: '',
})

export default function ProgramForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [points, setPoints] = useState(
    Array.from({ length: POINT_COUNT }, (_, i) => emptyPoint(i + 1))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [existingProgramId, setExistingProgramId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState(null)

  useEffect(() => {
    async function loadExisting() {
      const { data } = await supabase
        .from('programs')
        .select('id, status, rejection_reason, program_points(order, category, title)')
        .eq('user_id', profile.id)
        .single()

      if (data) {
        if (data.status === 'approved' || data.status === 'pending') {
          navigate(`/profil/${profile.id}`)
          return
        }
        setExistingProgramId(data.id)
        setRejectionReason(data.rejection_reason ?? null)
        if (data.program_points?.length) {
          const sorted = [...data.program_points].sort((a, b) => a.order - b.order)
          setPoints(sorted.map((pt) => ({ ...pt })))
        }
      }
    }
    loadExisting()
  }, [profile.id, navigate])

  function updatePoint(order, field, value) {
    setPoints((prev) => prev.map((p) => p.order === order ? { ...p, [field]: value } : p))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let programId = existingProgramId

    if (!programId) {
      const { data, error } = await supabase
        .from('programs')
        .insert({ user_id: profile.id })
        .select('id')
        .single()
      if (error) { setError(error.message); setLoading(false); return }
      programId = data.id
    } else {
      const { error: resubmitError } = await supabase.rpc('resubmit_program', { p_program_id: programId })
      if (resubmitError) { setError(resubmitError.message); setLoading(false); return }
      await supabase.from('program_points').delete().eq('program_id', programId)
    }

    const { error: pointsError } = await supabase
      .from('program_points')
      .insert(points.map((pt) => ({ ...pt, program_id: programId })))

    if (pointsError) { setError(pointsError.message); setLoading(false); return }

    navigate(`/profil/${profile.id}`)
  }

  return (
    <div className="program-form-page">
      {rejectionReason && (
        <div className="rejection-banner">
          <strong>Programme refusé —</strong> {rejectionReason}
        </div>
      )}

      <div className="form-hook">
        <p className="form-hook-label">Ta candidature à la présidence</p>
        <h1 className="form-hook-title">
          {existingProgramId ? 'Modifie ton programme' : 'Si tu étais élu président…'}
        </h1>
        {!existingProgramId && (
          <p className="form-hook-sub">
            Quelles seraient les <strong>6 réformes</strong> que tu appliquerais en priorité
            pour changer la France ?
          </p>
        )}
      </div>

      <div className="form-explainer">
        <div className="form-explainer-item">
          <span className="form-explainer-icon">⚔️</span>
          <div>
            <strong>Comment ça marche ?</strong>
            <p>Ton programme sera affiché face à celui d'un autre candidat. Les visiteurs votent pour le programme qu'ils préfèrent. Chaque victoire améliore ta popularité et ta position dans le classement.</p>
          </div>
        </div>
        <div className="form-explainer-item">
          <span className="form-explainer-icon">📝</span>
          <div>
            <strong>6 propositions, libres à toi</strong>
            <p>Choisis la catégorie qui correspond le mieux à chaque point. Tu peux tout à fait avoir plusieurs propositions dans la même catégorie — l'important, c'est que ton programme te ressemble.</p>
          </div>
        </div>
        <div className="form-explainer-item">
          <span className="form-explainer-icon">✅</span>
          <div>
            <strong>Modération avant publication</strong>
            <p>Ton programme est relu avant d'être visible. Sois clair, honnête et évite tout contenu offensant.</p>
          </div>
        </div>
        {!existingProgramId && (
          <div className="form-explainer-item">
            <span className="form-explainer-icon">⚠️</span>
            <div>
              <strong>Programme définitif</strong>
              <p>Une fois soumis, ton programme ne pourra plus être modifié. Prends le temps de bien rédiger tes 6 propositions.</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="points-questionnaire">
          {points.map((pt) => (
            <div key={pt.order} className="point-q">
              <div className="point-q-label">
                <span className="point-q-num">
                  Réforme {String(pt.order).padStart(2, '0')}
                </span>
                <span className="point-q-dot">·</span>
                <select
                  className="point-q-select"
                  value={pt.category}
                  onChange={(e) => updatePoint(pt.order, 'category', e.target.value)}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <input
                className="point-q-input"
                type="text"
                placeholder={PLACEHOLDERS[pt.order - 1]}
                value={pt.title}
                onChange={(e) => updatePoint(pt.order, 'title', e.target.value)}
                maxLength={200}
                required
              />
            </div>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Soumettre à la modération'}
        </button>
      </form>
    </div>
  )
}
