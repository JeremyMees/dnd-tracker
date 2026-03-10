import { describe, expect, it } from 'vitest'
import { isPro, isMedior, hasCorrectSubscription, getMax } from '~/utils/subscription-helpers'
import type { StripeSubscriptionType } from '~~/shared/types/stripe'

describe('subscription-helpers', () => {
  describe('isPro', () => {
    it('returns true for pro subscription', () => {
      const profile = { subscription_type: 'pro' } as any
      expect(isPro(profile)).toBe(true)
    })

    it('returns false for non-pro subscription', () => {
      const mediorProfile = { subscription_type: 'medior' } as any
      const freeProfile = { subscription_type: 'free' } as any

      expect(isPro(mediorProfile)).toBe(false)
      expect(isPro(freeProfile)).toBe(false)
    })
  })

  describe('isMedior', () => {
    it('returns true for medior subscription', () => {
      const profile = { subscription_type: 'medior' } as any
      expect(isMedior(profile)).toBe(true)
    })

    it('returns true for pro subscription', () => {
      const profile = { subscription_type: 'pro' } as any
      expect(isMedior(profile)).toBe(true)
    })

    it('returns false for free subscription', () => {
      const profile = { subscription_type: 'free' } as any
      expect(isMedior(profile)).toBe(false)
    })
  })

  describe('hasCorrectSubscription', () => {
    it('returns true when subscription is pro regardless of expected', () => {
      expect(hasCorrectSubscription('pro', 'free')).toBe(true)
      expect(hasCorrectSubscription('pro', 'medior')).toBe(true)
      expect(hasCorrectSubscription('pro', 'pro')).toBe(true)
    })

    it('returns true when subscription matches expected', () => {
      expect(hasCorrectSubscription('free', 'free')).toBe(true)
      expect(hasCorrectSubscription('medior', 'medior')).toBe(true)
    })

    it('returns true when subscription is medior and expected is free', () => {
      expect(hasCorrectSubscription('medior', 'free')).toBe(true)
    })

    it('returns false when subscription is free and expected is medior', () => {
      expect(hasCorrectSubscription('free', 'medior')).toBe(false)
    })

    it('returns false when subscription is free and expected is pro', () => {
      expect(hasCorrectSubscription('free', 'pro')).toBe(false)
    })

    it('returns false when subscription is medior and expected is pro', () => {
      expect(hasCorrectSubscription('medior', 'pro')).toBe(false)
    })
  })

  describe('getMax', () => {
    const testCases: Array<{
      type: 'encounter' | 'campaign' | 'team'
      subscription: StripeSubscriptionType
      expected: number
    }> = [
      { type: 'encounter', subscription: 'pro', expected: 250 },
      { type: 'campaign', subscription: 'pro', expected: 25 },
      { type: 'team', subscription: 'pro', expected: 15 },
      { type: 'encounter', subscription: 'medior', expected: 50 },
      { type: 'campaign', subscription: 'medior', expected: 10 },
      { type: 'team', subscription: 'medior', expected: 3 },
      { type: 'encounter', subscription: 'free', expected: 10 },
      { type: 'campaign', subscription: 'free', expected: 3 },
      { type: 'team', subscription: 'free', expected: 1 },
    ]

    testCases.forEach(({ type, subscription, expected }) => {
      it(`returns ${expected} for ${type} with ${subscription} subscription`, () => {
        expect(getMax(type, subscription)).toBe(expected)
      })
    })

    it('handles "upgrade to pro" subscription type as free (default)', () => {
      expect(getMax('encounter', 'upgrade to pro')).toBe(10)
      expect(getMax('campaign', 'upgrade to pro')).toBe(3)
      expect(getMax('team', 'upgrade to pro')).toBe(1)
    })
  })
})
