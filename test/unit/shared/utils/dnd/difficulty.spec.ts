import { describe, expect, it } from 'vitest'
import { encounterDifficulty } from '~~/shared/utils/dnd/difficulty'

type Row = Parameters<typeof encounterDifficulty>[0][number]

const party: Row[] = [
  { type: 'player', level: 3 },
  { type: 'player', level: 3 },
]

function monsters(...challengeRatings: number[]): Row[] {
  return challengeRatings.map(challengeRating => ({
    type: 'monster',
    challengeRating,
  }))
}

describe('dnd/difficulty', () => {
  describe('encounterDifficulty', () => {
    it('Should add up the budget of every player with a level', () => {
      expect(encounterDifficulty([...party, ...monsters(1)])?.budget).toEqual({
        low: 300,
        moderate: 450,
        high: 800,
      })
    })

    it('Should add up the XP of every monster', () => {
      expect(
        encounterDifficulty([...party, ...monsters(1, 0.25, 0.25)])?.experience,
      ).toBe(300)
    })

    it.each([
      [[0.25, 0.25], 'trivial'],
      [[1, 0.5], 'low'],
      [[2], 'moderate'],
      [[3, 0.5], 'high'],
      [[4, 1], 'extreme'],
    ] as const)('Should rate monsters %j as %s', (challengeRatings, rating) => {
      expect(
        encounterDifficulty([...party, ...monsters(...challengeRatings)])
          ?.rating,
      ).toBe(rating)
    })

    it('Should ignore rows that are not monsters', () => {
      const difficulty = encounterDifficulty([
        ...party,
        ...monsters(1),
        { type: 'summon', challengeRating: 5 },
        { type: 'npc', challengeRating: 5 },
      ])

      expect(difficulty?.experience).toBe(200)
    })

    it('Should count the players without a level', () => {
      const difficulty = encounterDifficulty([
        ...party,
        { type: 'player' },
        ...monsters(1),
      ])

      expect(difficulty).toMatchObject({ players: 3, playersWithoutLevel: 1 })
    })

    it('Should not rate an encounter without levelled players', () => {
      expect(
        encounterDifficulty([{ type: 'player' }, ...monsters(1)]),
      ).toBeUndefined()
    })

    it('Should not rate an encounter without monster XP', () => {
      expect(
        encounterDifficulty([...party, { type: 'monster' }]),
      ).toBeUndefined()
    })
  })
})
