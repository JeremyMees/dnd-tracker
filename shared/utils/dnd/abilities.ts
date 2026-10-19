export function modifierFromScore(score: number): number {
  if (score < 1) return -5

  return Math.floor((score - 10) / 2)
}
