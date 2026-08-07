import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { stripe } from '~~/server/utils/stripe'
import handler from '~~/server/api/stripe/subscribe.post'

function body(overrides: Record<string, unknown> = {}) {
  return {
    lookup: 'price_lookup_key',
    locale: 'en',
    ...overrides,
  }
}

function mockPrice(overrides: Record<string, unknown> = {}) {
  vi.spyOn(stripe.prices, 'retrieve').mockResolvedValue({
    active: true,
    id: 'price_1',
    product: { id: 'prod_1', name: 'Pro', deleted: false },
    ...overrides,
  } as never)
}

function mockCheckoutSession(overrides: Record<string, unknown> = {}) {
  vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
    id: 'cs_1',
    url: 'https://checkout.stripe.com/cs_1',
    ...overrides,
  } as never)
}

describe('POST /api/stripe/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ public: { appDomain: 'https://dnd-tracker.com/' } })
  })

  it('starts a checkout session for an existing Stripe customer', async () => {
    mockFrom({
      profiles: mockChain({
        data: {
          id: 'user-1',
          email: 'dm@example.com',
          stripeId: 'cus_1',
          subscriptionType: 'medior',
        },
        error: null,
      }),
    })
    mockPrice()
    mockCheckoutSession()

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual({ url: 'https://checkout.stripe.com/cs_1' })

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_1' }),
    )
  })

  it('creates a Stripe customer when the profile has none', async () => {
    mockFrom({
      profiles: mockChain({
        data: {
          id: 'user-1',
          email: 'dm@example.com',
          stripeId: null,
          subscriptionType: 'medior',
        },
        error: null,
      }),
    })
    mockPrice()
    mockCheckoutSession()
    vi.spyOn(stripe.customers, 'create').mockResolvedValue({
      id: 'cus_new',
    } as never)

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'dm@example.com',
    })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_new' }),
    )
  })

  it('throws a 404 when the profile does not exist', async () => {
    mockFrom({ profiles: mockChain({ data: null, error: null }) })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Profile not found',
    })
  })

  it('throws a 400 when the price is inactive', async () => {
    mockFrom({
      profiles: mockChain({
        data: {
          id: 'user-1',
          email: 'dm@example.com',
          stripeId: 'cus_1',
          subscriptionType: 'medior',
        },
        error: null,
      }),
    })
    mockPrice({ active: false })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Inactive price',
    })
  })

  it('throws a 403 when upgrading without a medior subscription', async () => {
    mockFrom({
      profiles: mockChain({
        data: {
          id: 'user-1',
          email: 'dm@example.com',
          stripeId: 'cus_1',
          subscriptionType: 'pro',
        },
        error: null,
      }),
    })
    mockPrice({
      product: { id: 'prod_1', name: 'Upgrade to Pro', deleted: false },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Upgrade price not available for this account',
    })
  })

  it('throws when saving the checkout session fails', async () => {
    mockFrom({
      profiles: mockChain({
        data: {
          id: 'user-1',
          email: 'dm@example.com',
          stripeId: 'cus_1',
          subscriptionType: 'medior',
        },
        error: { message: 'boom' },
      }),
    })
    mockPrice()
    mockCheckoutSession()

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to start checkout.' })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: body({ locale: 'fr' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
