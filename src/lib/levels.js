export const LEVELS = [
  { level: 1, title: 'Novice',              minElo: 0    },
  { level: 2, title: 'Conseiller municipal', minElo: 1100 },
  { level: 3, title: 'Maire',               minElo: 1250 },
  { level: 4, title: 'Député',              minElo: 1450 },
  { level: 5, title: 'Ministre',            minElo: 1700 },
  { level: 6, title: 'Président',           minElo: 2100 },
]

export function getLevel(elo) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (elo >= LEVELS[i].minElo) return LEVELS[i]
  }
  return LEVELS[0]
}
