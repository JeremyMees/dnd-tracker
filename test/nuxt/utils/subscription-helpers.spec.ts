import { describe, expect, it } from 'vitest'
import { isPro, isMedior, hasCorrectSubscription, getMax } from '~/utils/subscription-helpers'
import type { StripeSubscriptionType } from '~~/shared/types/stripe'

describe('subscription-helpers', () => {
  describe('isPro', () => {
    it('returns true for pro subscription', () => {
      const profile = { subscriptionType: 'pro' } as any
      expect(isPro(profile)).toBeTruthy()
    })

    it('returns false for non-pro subscription', () => {
      const mediorProfile = { subscriptionType: 'medior' } as any
      const freeProfile = { subscriptionType: 'free' } as any

      expect(isPro(mediorProfile)).toBeFalsy()
      expect(isPro(freeProfile)).toBeFalsy()
    })
  })

  describe('isMedior', () => {
    it('returns true for medior subscription', () => {
      const profile = { subscriptionType: 'medior' } as any
      expect(isMedior(profile)).toBeTruthy()
    })

    it('returns true for pro subscription', () => {
      const profile = { subscriptionType: 'pro' } as any
      expect(isMedior(profile)).toBeTruthy()
    })

    it('returns false for free subscription', () => {
      const profile = { subscriptionType: 'free' } as any
      expect(isMedior(profile)).toBeFalsy()
    })
  })

  describe('hasCorrectSubscription', () => {
    it('returns true when subscription is pro regardless of expected', () => {
      expect(hasCorrectSubscription('pro', 'free')).toBeTruthy()
      expect(hasCorrectSubscription('pro', 'medior')).toBeTruthy()
      expect(hasCorrectSubscription('pro', 'pro')).toBeTruthy()
    })

    it('returns true when subscription matches expected', () => {
      expect(hasCorrectSubscription('free', 'free')).toBeTruthy()
      expect(hasCorrectSubscription('medior', 'medior')).toBeTruthy()
    })

    it('returns true when subscription is medior and expected is free', () => {
      expect(hasCorrectSubscription('medior', 'free')).toBeTruthy()
    })

    it('returns false when subscription is free and expected is medior', () => {
      expect(hasCorrectSubscription('free', 'medior')).toBeFalsy()
    })

    it('returns false when subscription is free and expected is pro', () => {
      expect(hasCorrectSubscription('free', 'pro')).toBeFalsy()
    })

    it('returns false when subscription is medior and expected is pro', () => {
      expect(hasCorrectSubscription('medior', 'pro')).toBeFalsy()
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
