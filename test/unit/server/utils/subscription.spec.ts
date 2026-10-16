import { describe, expect, it } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import { campaignOwnerIsPro, isProUser } from '~~/server/utils/subscription'

describe('subscription', () => {
  describe('isProUser', () => {
    it.each([
      [{ subscriptionType: 'pro' }, true],
      [{ subscriptionType: 'free' }, false],
      [null, false],
    ])('reads %o as pro: %s', async (profile, result) => {
      const profiles = mockChain({ data: profile, error: null })
      mockFrom({ profiles })

      await expect(
        isProUser(serverSupabaseServiceRole({} as never), 'user-1'),
      ).resolves.toBe(result)
      expect(profiles.eq).toHaveBeenCalledWith('id', 'user-1')
    })
  })

  describe('campaignOwnerIsPro', () => {
    it('checks the plan of the campaign owner', async () => {
      const profiles = mockChain({
        data: { subscriptionType: 'pro' },
        error: null,
      })
      mockFrom({
        campaigns: mockChain({ data: { createdBy: 'owner-1' }, error: null }),
        profiles,
      })

      await expect(
        campaignOwnerIsPro(serverSupabaseServiceRole({} as never), 42),
      ).resolves.toBe(true)
      expect(profiles.eq).toHaveBeenCalledWith('id', 'owner-1')
    })

    it('is false when the campaign does not exist', async () => {
      mockFrom({ campaigns: mockChain({ data: null, error: null }) })

      await expect(
        campaignOwnerIsPro(serverSupabaseServiceRole({} as never), 42),
      ).resolves.toBe(false)
    })
  })
})
