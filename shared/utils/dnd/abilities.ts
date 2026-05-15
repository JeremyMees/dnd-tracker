export function modifierFromScore(score: number): number {
  if (score < 1) return -5
  if (score > 20) return 5
  else return Math.floor((score - 10) / 2)
}
