import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { stripe } from '~~/server/utils/stripe'
import handler from '~~/server/api/stripe/portal.post'

function mockPortalSession(overrides: Record<string, unknown> = {}) {
  vi.spyOn(stripe.billingPortal.sessions, 'create').mockResolvedValue({
    id: 'bps_1',
    url: 'https://billing.stripe.com/bps_1',
    ...overrides,
  } as never)
}

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ public: { appDomain: 'https://dnd-tracker.com' } })
  })

  it('returns a billing portal url for the customer', async () => {
    mockFrom({ profiles: mockChain({ data: { stripeId: 'cus_1' } }) })
    mockPortalSession()

    await expect(handler(mockEvent({ method: 'POST' }))).resolves.toEqual({
      url: 'https://billing.stripe.com/bps_1',
    })

    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://dnd-tracker.com/profile',
    })
  })

  it('looks up the profile of the authenticated user', async () => {
    const profiles = mockChain({ data: { stripeId: 'cus_1' } })
    mockFrom({ profiles })
    mockPortalSession()

    await handler(mockEvent({ method: 'POST' }))

    expect(profiles.select).toHaveBeenCalledWith('stripeId')
    expect(profiles.eq).toHaveBeenCalledWith('id', 'user-1')
    expect(profiles.single).toHaveBeenCalled()
  })

  it('throws a 400 when the profile has no billing account', async () => {
    mockFrom({ profiles: mockChain({ data: { stripeId: null } }) })

    await expect(handler(mockEvent({ method: 'POST' }))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'No billing account',
    })

    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled()
  })

  it('throws a 400 when the profile does not exist', async () => {
    mockFrom({
      profiles: mockChain({ data: null, error: { message: 'boom' } }),
    })

    await expect(handler(mockEvent({ method: 'POST' }))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'No billing account',
    })

    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled()
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(handler(mockEvent({ method: 'POST' }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})
