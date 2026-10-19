import { experienceBudgets, extremeDifficultyFactor } from '~~/constants/dnd'

function ratingFor(
  experience: number,
  budget: ExperienceBudget,
): DifficultyRating {
  if (experience >= budget.high * extremeDifficultyFactor) return 'extreme'
  if (experience >= budget.high) return 'high'
  if (experience >= budget.moderate) return 'moderate'
  if (experience >= budget.low) return 'low'

  return 'trivial'
}

export function encounterDifficulty(
  rows: Pick<InitiativeSheetRow, 'type' | 'level' | 'challengeRating'>[],
): EncounterDifficulty | undefined {
  const players = rows.filter(row => row.type === 'player')
  const budgets = players
    .map(row => (row.level ? experienceBudgets[row.level] : undefined))
    .filter(isDefined)
  const experience = rows
    .filter(row => row.type === 'monster')
    .reduce((acc, row) => acc + experienceFromChallenge(row.challengeRating), 0)

  if (!budgets.length || !experience) return undefined

  const budget = budgets.reduce<ExperienceBudget>(
    (acc, item) => ({
      low: acc.low + item.low,
      moderate: acc.moderate + item.moderate,
      high: acc.high + item.high,
    }),
    { low: 0, moderate: 0, high: 0 },
  )

  return {
    rating: ratingFor(experience, budget),
    experience,
    budget,
    players: players.length,
    playersWithoutLevel: players.length - budgets.length,
  }
}
