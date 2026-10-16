import { describe, expect, it } from 'vitest'

describe('subscription', () => {
  describe('isProSubscription', () => {
    it.each([
      ['pro', true],
      ['free', false],
      [null, false],
      [undefined, false],
    ] as const)('treats %s as pro: %s', (subscription, result) => {
      expect(isProSubscription(subscription)).toBe(result)
    })
  })

  describe('canHaveCampaignMembers', () => {
    it('only allows members for a pro owner', () => {
      expect(canHaveCampaignMembers('pro')).toBe(true)
      expect(canHaveCampaignMembers('free')).toBe(false)
      expect(canHaveCampaignMembers(undefined)).toBe(false)
    })
  })

  describe('isCampaignSuspendedFor', () => {
    it('suspends members while the owner is not on pro', () => {
      expect(
        isCampaignSuspendedFor({ id: 'owner', subscriptionType: 'free' }, 'me'),
      ).toBe(true)
    })

    it('never suspends the owner', () => {
      expect(
        isCampaignSuspendedFor({ id: 'me', subscriptionType: 'free' }, 'me'),
      ).toBe(false)
    })

    it('does not suspend members of a pro owner', () => {
      expect(
        isCampaignSuspendedFor({ id: 'owner', subscriptionType: 'pro' }, 'me'),
      ).toBe(false)
    })
  })
})
