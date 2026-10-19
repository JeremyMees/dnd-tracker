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

  describe('experienceFromChallenge', () => {
    it.each([
      [0, 10],
      [0.125, 25],
      [0.5, 100],
      [5, 1800],
      [30, 155000],
    ])('Should give challenge %s %s XP', (cr, xp) => {
      expect(experienceFromChallenge(cr)).toBe(xp)
    })

    it('Should give no XP without a known challenge rating', () => {
      expect(experienceFromChallenge(undefined)).toBe(0)
      expect(experienceFromChallenge(0.3)).toBe(0)
    })
  })

  describe('toChallengeRating', () => {
    it.each([
      ['1/4', 0.25],
      [5, 5],
      ['0', 0],
    ])('Should read %s as challenge rating %s', (value, cr) => {
      expect(toChallengeRating(value)).toBe(cr)
    })

    it.each([0.3, 31, 'abc', undefined])(
      'Should reject %s as a challenge rating',
      value => {
        expect(toChallengeRating(value)).toBeUndefined()
      },
    )
  })
})
