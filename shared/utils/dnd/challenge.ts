export function proficiencyFromChallenge(
  challenge: number | undefined,
): number | undefined {
  if (challenge === undefined || !Number.isFinite(challenge)) return undefined

  return Math.min(Math.max(Math.floor((challenge - 1) / 4) + 2, 2), 10)
}
