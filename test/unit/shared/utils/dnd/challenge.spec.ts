import { describe, expect, it } from 'vitest'

describe('dnd/challenge', () => {
  describe('proficiencyFromChallenge', () => {
    it.each([
      [0, 2],
      [0.25, 2],
      [4, 2],
      [5, 3],
      [8, 3],
      [9, 4],
      [17, 6],
      [24, 7],
      [30, 9],
    ])('Should give challenge %s a proficiency bonus of %s', (cr, bonus) => {
      expect(proficiencyFromChallenge(cr)).toBe(bonus)
    })

    it('Should return undefined without a challenge rating', () => {
      expect(proficiencyFromChallenge(undefined)).toBeUndefined()
      expect(proficiencyFromChallenge(Number.NaN)).toBeUndefined()
    })
  })
})
