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
})
