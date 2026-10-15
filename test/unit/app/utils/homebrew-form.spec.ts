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
