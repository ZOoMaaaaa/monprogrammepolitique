import { LEVELS } from '../lib/levels'

export default function RulesPage() {
  return (
    <div className="rules-page">
      <h1>Comment ça marche ?</h1>

      <section className="rules-section">
        <div className="rules-icon">✍️</div>
        <h2>1. Rédige ton programme</h2>
        <p>
          Crée ton programme politique en <strong>6 réformes</strong>, chacune associée à un thème
          (Éducation, Santé, Économie, Environnement…). Sois convainquant : c'est ce que les autres
          utilisateurs vont évaluer.
        </p>
      </section>

      <section className="rules-section">
        <div className="rules-icon">⚔️</div>
        <h2>2. Affronte les autres en duel</h2>
        <p>
          Les programmes approuvés s'affrontent en duel. Tu votes pour celui qui te convainc le
          plus. Chaque vote fait évoluer les scores des deux candidats selon un système ELO : le
          vainqueur gagne des points, le perdant en perd.
        </p>
      </section>

      <section className="rules-section">
        <div className="rules-icon">📈</div>
        <h2>3. Gagne des points de popularité</h2>
        <p>Tu accumules des points de deux façons :</p>
        <ul>
          <li>
            <strong>Ton programme est voté :</strong> si ton programme remporte un duel, tu gagnes
            des points ELO (calculés selon l'écart de niveau avec ton adversaire).
          </li>
          <li>
            <strong>Tu votes :</strong> chaque vote que tu accordes te rapporte <strong>+1 point</strong>.
            Ce bonus est limité à <strong>30 votes par jour</strong> — après ça, tu peux continuer
            à voter mais sans gain de points. Le compteur se remet à zéro chaque jour à minuit.
          </li>
        </ul>
      </section>

      <section className="rules-section">
        <div className="rules-icon">🏅</div>
        <h2>4. Monte en grade</h2>
        <p>Ton score détermine ton titre politique. Plus tu gagnes de points, plus tu avances :</p>
        <div className="rules-levels">
          {LEVELS.map((l) => (
            <div key={l.level} className="rules-level-row">
              <span className="rules-level-title">{l.title}</span>
              <span className="rules-level-elo">{l.minElo === 0 ? 'Départ' : `${l.minElo} pts`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rules-section">
        <div className="rules-icon">🏛️</div>
        <h2>5. Décroche la présidence</h2>
        <p>
          Atteins <strong>2 100 points</strong> pour obtenir le titre de <strong>Président</strong> et
          figurer en tête du classement général. La compétition est ouverte à tous — à toi de jouer.
        </p>
      </section>
    </div>
  )
}
