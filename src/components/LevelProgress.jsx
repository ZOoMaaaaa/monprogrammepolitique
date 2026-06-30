import { getLevel, LEVELS } from '../lib/levels'

export default function LevelProgress({ elo }) {
  const current = getLevel(elo)
  const nextLevel = LEVELS.find((l) => l.level === current.level + 1)

  if (!nextLevel) {
    return (
      <div className="level-progress">
        <div className="level-progress-label">
          <span className="level-title">{current.title}</span>
          <span className="level-max">Niveau maximum atteint 🏆</span>
        </div>
      </div>
    )
  }

  const from = current.minElo
  const to = nextLevel.minElo
  const pct = Math.round(((elo - from) / (to - from)) * 100)

  return (
    <div className="level-progress">
      <div className="level-progress-label">
        <span className="level-title">{current.title}</span>
        <span className="level-next">→ {nextLevel.title} ({to - elo} pts)</span>
      </div>
      <div className="level-bar-track">
        <div className="level-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
