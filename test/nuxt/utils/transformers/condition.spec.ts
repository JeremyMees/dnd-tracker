import { describe, expect, it } from 'vitest'
import {
  open5eV2ConditionFixture,
  open5eV2ExhaustionFixture,
  open5eV1ConditionFixture,
  open5eV1ExhaustionFixture,
} from '~~/test/nuxt/fixtures/open5e'

describe('transformers/condition', () => {
  describe('toCondition (V2)', () => {
    it('maps core fields', () => {
      const condition = toCondition(open5eV2ConditionFixture)

      expect(condition.id).toBe('blinded')
      expect(condition.name).toBe('Blinded')
      expect(condition.desc).toBe('A Blinded creature cannot see.')
    })

    it('does not add hasLevels for regular conditions', () => {
      const condition = toCondition(open5eV2ConditionFixture)

      expect(condition.hasLevels).toBeUndefined()
      expect(condition.level).toBeUndefined()
    })

    it('adds hasLevels and level 1 for exhaustion', () => {
      const condition = toCondition(open5eV2ExhaustionFixture)

      expect(condition.hasLevels).toBeTruthy()
      expect(condition.level).toBe(1)
    })
  })

  describe('toCondition (V1)', () => {
    it('maps core fields using slug as id', () => {
      const condition = toCondition(open5eV1ConditionFixture)

      expect(condition.id).toBe('blinded')
      expect(condition.name).toBe('Blinded')
      expect(condition.desc).toBe('The creature cannot see and automatically fails any ability check that requires sight.')
    })

    it('falls back to effects_desc when desc is empty', () => {
      const condition = toCondition(open5eV1ExhaustionFixture)

      expect(condition.desc).toContain('Level 1')
      expect(condition.desc).toContain('Level 2')
    })

    it('adds hasLevels and parses level from string for exhaustion', () => {
      const condition = toCondition(open5eV1ExhaustionFixture)

      expect(condition.hasLevels).toBeTruthy()
      expect(condition.level).toBe(2)
    })

    it('does not add hasLevels for regular conditions', () => {
      const condition = toCondition(open5eV1ConditionFixture)

      expect(condition.hasLevels).toBeUndefined()
      expect(condition.level).toBeUndefined()
    })
  })
})
