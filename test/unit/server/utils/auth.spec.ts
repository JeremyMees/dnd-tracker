import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { requireUser, requireCampaignAccess } from '~~/server/utils/auth'

const { serverSupabaseUser, serverSupabaseServiceRole } = vi.hoisted(() => ({
  serverSupabaseUser: vi.fn(),
  serverSupabaseServiceRole: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser,
  serverSupabaseServiceRole,
}))

const event = { path: '/api/campaign/1' } as H3Event

const campaign = { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' }

function mockServiceRole({
  campaignResult = { data: campaign, error: null } as Record<string, unknown>,
  memberResult = { data: null } as Record<string, unknown>,
} = {}) {
  const single = vi.fn().mockResolvedValue(campaignResult)
  const eq = vi.fn(() => ({ single }))
  const maybeSingle = vi.fn().mockResolvedValue(memberResult)
  const match = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(columns => (columns === 'role' ? { match } : { eq }))
  const from = vi.fn(() => ({ select }))

  serverSupabaseServiceRole.mockReturnValue({ from })

  return { from, select, eq, single, match, maybeSingle }
}

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireUser', () => {
    it('returns the session user for authenticated claims', async () => {
      serverSupabaseUser.mockResolvedValue({
        sub: 'user-1',
        email: 'dm@example.com',
        role: 'authenticated',
      })

      await expect(requireUser(event)).resolves.toEqual({
        id: 'user-1',
        email: 'dm@example.com',
        claims: {
          sub: 'user-1',
          email: 'dm@example.com',
          role: 'authenticated',
        },
      })
    })

    it('leaves email undefined when the claims have none', async () => {
      serverSupabaseUser.mockResolvedValue({ sub: 'user-1' })

      const user = await requireUser(event)

      expect(user.id).toBe('user-1')
      expect(user.email).toBeUndefined()
    })

    it('throws a 401 when there are no claims', async () => {
      serverSupabaseUser.mockResolvedValue(null)

      await expect(requireUser(event)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    })

    it('throws a 401 when the claims have no subject', async () => {
      serverSupabaseUser.mockResolvedValue({ email: 'dm@example.com' })

      await expect(requireUser(event)).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  describe('requireCampaignAccess', () => {
    it('resolves the creator as Owner without looking up the team', async () => {
      const { from, maybeSingle } = mockServiceRole()

      await expect(requireCampaignAccess(event, 42, 'user-1')).resolves.toEqual(
        {
          id: 42,
          title: 'Curse of Strahd',
          role: 'Owner',
        },
      )

      expect(from).toHaveBeenCalledTimes(1)
      expect(from).toHaveBeenCalledWith('campaigns')
      expect(maybeSingle).not.toHaveBeenCalled()
    })

    it('resolves the role from the team for other users', async () => {
      const { from, match } = mockServiceRole({
        memberResult: { data: { role: 'Admin' } },
      })

      await expect(requireCampaignAccess(event, 42, 'user-2')).resolves.toEqual(
        {
          id: 42,
          title: 'Curse of Strahd',
          role: 'Admin',
        },
      )

      expect(from).toHaveBeenCalledWith('team')
      expect(match).toHaveBeenCalledWith({ campaign: 42, user: 'user-2' })
    })

    it('queries the campaign by id', async () => {
      const { eq } = mockServiceRole()

      await requireCampaignAccess(event, 42, 'user-1')

      expect(eq).toHaveBeenCalledWith('id', 42)
    })

    it('throws a 404 when the campaign query errors', async () => {
      mockServiceRole({
        campaignResult: { data: null, error: { message: 'boom' } },
      })

      await expect(
        requireCampaignAccess(event, 42, 'user-1'),
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Campaign not found',
      })
    })

    it('throws a 404 when the campaign does not exist', async () => {
      mockServiceRole({ campaignResult: { data: null, error: null } })

      await expect(
        requireCampaignAccess(event, 42, 'user-1'),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws a 403 when the user is not a member', async () => {
      mockServiceRole({ memberResult: { data: null } })

      await expect(
        requireCampaignAccess(event, 42, 'user-2'),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden',
      })
    })

    it('throws a 403 when the role is not allowed', async () => {
      mockServiceRole({ memberResult: { data: { role: 'Viewer' } } })

      await expect(
        requireCampaignAccess(event, 42, 'user-2', ['Owner', 'Admin']),
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it('throws a 403 for the creator when Owner is not allowed', async () => {
      mockServiceRole()

      await expect(
        requireCampaignAccess(event, 42, 'user-1', ['Admin']),
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it('accepts every role by default', async () => {
      mockServiceRole({ memberResult: { data: { role: 'Viewer' } } })

      await expect(
        requireCampaignAccess(event, 42, 'user-2'),
      ).resolves.toMatchObject({ role: 'Viewer' })
    })
  })
})
