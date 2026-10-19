import { challengeExperience } from '~~/constants/dnd'

export function proficiencyFromChallenge(
  challenge: number | undefined,
): number | undefined {
  if (challenge === undefined || !Number.isFinite(challenge)) return undefined

  return Math.min(Math.max(Math.floor((challenge - 1) / 4) + 2, 2), 10)
}

export function experienceFromChallenge(challenge: number | undefined): number {
  if (challenge === undefined) return 0

  return challengeExperience[challenge] ?? 0
}
