import { describe, expect, it } from 'vitest'

describe('homebrew-form', () => {
  describe('homebrewTabOf', () => {
    it.each([
      ['name', 'info'],
      ['speed.walk', 'info'],
      ['abilityScores.strength', 'stats'],
      ['skillBonuses.stealth', 'stats'],
      ['traits[0].name', 'traits'],
      ['resistancesAndImmunities.damageImmunities', 'traits'],
      ['actions[2].attacks[0].name', 'actions'],
    ])('Should put %s on the %s tab', (path, tab) => {
      expect(homebrewTabOf(path)).toBe(tab)
    })

    it('Should fall back to the info tab for an unknown field', () => {
      expect(homebrewTabOf('somethingElse')).toBe('info')
    })
  })

  describe('invalidHomebrewTabs', () => {
    it('Should list every tab with an error once, in tab order', () => {
      expect(
        invalidHomebrewTabs({
          'actions[0].name': 'Required',
          name: 'Too short',
          'actions[1].name': 'Required',
        }),
      ).toEqual(['info', 'actions'])
    })

    it('Should skip paths without an error message', () => {
      expect(
        invalidHomebrewTabs({ name: '', 'traits[0].name': undefined }),
      ).toEqual([])
    })
  })

  describe('toHomebrewSubmission', () => {
    const values = {
      ...homebrewInitialValues({ name: 'Grommash', type: 'summon' }),
      amount: 2,
      initiative: 14,
      initiativeModifier: 3,
      summoner: 'row-1',
    } as HomebrewFormValues

    it('Should split the encounter only fields from the data', () => {
      const submission = toHomebrewSubmission(values)

      expect(submission).toMatchObject({
        amount: 2,
        initiative: 14,
        initiativeModifier: 3,
        summoner: 'row-1',
      })
      expect(submission.row).not.toHaveProperty('amount')
      expect(submission.row).not.toHaveProperty('initiative')
      expect(submission.row).not.toHaveProperty('summoner')
      expect(submission.row).toMatchObject({ name: 'Grommash', type: 'summon' })
    })

    it('Should keep the level of a player', () => {
      const submission = toHomebrewSubmission({
        ...values,
        type: 'player',
        level: 5,
      })

      expect(submission.row.level).toBe(5)
      expect(submission.homebrew.level).toBe(5)
    })

    it('Should clear the level for other types', () => {
      const submission = toHomebrewSubmission({ ...values, level: 5 })

      expect(submission.row.level).toBeUndefined()
      expect(submission.homebrew.level).toBeNull()
    })

    it('Should keep the challenge rating of a monster', () => {
      const submission = toHomebrewSubmission({
        ...values,
        type: 'monster',
        challengeRating: 0.25,
      })

      expect(submission.row.challengeRating).toBe(0.25)
      expect(submission.homebrew.challengeRating).toBe(0.25)
    })

    it('Should clear the challenge rating for other types', () => {
      const submission = toHomebrewSubmission({ ...values, challengeRating: 2 })

      expect(submission.row.challengeRating).toBeUndefined()
      expect(submission.homebrew.challengeRating).toBeNull()
    })

    it('Should store the initiative modifier as text on the homebrew', () => {
      expect(toHomebrewSubmission(values).homebrew).toMatchObject({
        name: 'Grommash',
        initiativeModifier: '3',
      })
    })

    it('Should leave the initiative modifier off the homebrew when empty', () => {
      const submission = toHomebrewSubmission({
        ...values,
        initiativeModifier: undefined,
      })

      expect(submission.homebrew).not.toHaveProperty('initiativeModifier')
    })
  })
})
