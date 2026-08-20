import { describe, expect, it } from 'vitest'
import { isPro, getMax } from '~/utils/subscription-helpers'

const profileWith = (subscriptionType: SubscriptionType) =>
  ({ subscriptionType }) as unknown as ProfileRow

describe('subscription-helpers', () => {
  describe('isPro', () => {
    it('returns true for pro subscription', () => {
      const profile = profileWith('pro')
      expect(isPro(profile)).toBeTruthy()
    })

    it('returns false for non-pro subscription', () => {
      const freeProfile = profileWith('free')

      expect(isPro(freeProfile)).toBeFalsy()
    })
  })

  describe('getMax', () => {
    const testCases: Array<{
      type: 'encounter' | 'campaign' | 'team'
      subscription: SubscriptionType
      expected: number
    }> = [
      { type: 'encounter', subscription: 'pro', expected: 250 },
      { type: 'campaign', subscription: 'pro', expected: 25 },
      { type: 'team', subscription: 'pro', expected: 15 },
      { type: 'encounter', subscription: 'free', expected: 10 },
      { type: 'campaign', subscription: 'free', expected: 3 },
      { type: 'team', subscription: 'free', expected: 1 },
    ]

    testCases.forEach(({ type, subscription, expected }) => {
      it(`returns ${expected} for ${type} with ${subscription} subscription`, () => {
        expect(getMax(type, subscription)).toBe(expected)
      })
    })

    it('returns undefined for an unknown type', () => {
      const unknownType = 'unknown' as unknown as 'encounter'

      expect(getMax(unknownType, 'pro')).toBeUndefined()
      expect(getMax(unknownType, 'free')).toBeUndefined()
    })
  })
})
