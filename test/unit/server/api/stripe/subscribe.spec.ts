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

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'dm@example.com',
    stripeId: 'cus_1',
    stripeSubscriptionId: null,
    billingInterval: null,
    ...overrides,
  }
}

function mockPrice(overrides: Record<string, unknown> = {}) {
  vi.spyOn(stripe.prices, 'retrieve').mockResolvedValue({
    active: true,
    id: 'price_1',
    type: 'one_time',
    product: {
      id: 'prod_1',
      name: 'Pro',
      deleted: false,
      metadata: { tier: 'pro' },
    },
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

  it('opens a one-time checkout for a lifetime price', async () => {
    mockFrom({ profiles: mockChain({ data: profile(), error: null }) })
    mockPrice()
    mockCheckoutSession()

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual({ url: 'https://checkout.stripe.com/cs_1' })

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment', customer: 'cus_1' }),
    )
  })

  it('opens a subscription checkout for a recurring price', async () => {
    mockFrom({ profiles: mockChain({ data: profile(), error: null }) })
    mockPrice({ type: 'recurring' })
    mockCheckoutSession()

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription', customer: 'cus_1' }),
    )
  })

  it('persists a new Stripe customer before creating the session', async () => {
    const profiles = mockChain({
      data: profile({ stripeId: null }),
      error: null,
    })
    mockFrom({ profiles })
    mockPrice()
    mockCheckoutSession()
    vi.spyOn(stripe.customers, 'create').mockResolvedValue({
      id: 'cus_new',
    } as never)

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'dm@example.com',
    })
    expect(profiles.update).toHaveBeenNthCalledWith(1, { stripeId: 'cus_new' })
    expect(profiles.update.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(stripe.checkout.sessions.create).mock.invocationCallOrder[0]!,
    )
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_new' }),
    )
    expect(profiles.update).toHaveBeenNthCalledWith(2, {
      stripeSessionId: 'cs_1',
    })
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

  it('throws a 403 when the profile already owns lifetime', async () => {
    mockFrom({
      profiles: mockChain({
        data: profile({ billingInterval: 'lifetime' }),
        error: null,
      }),
    })
    mockPrice({ type: 'recurring' })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Already lifetime',
    })

    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('throws a 409 when a monthly subscriber starts another subscription', async () => {
    mockFrom({
      profiles: mockChain({
        data: profile({
          billingInterval: 'month',
          stripeSubscriptionId: 'sub_1',
        }),
        error: null,
      }),
    })
    mockPrice({ type: 'recurring' })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Use the billing portal',
    })

    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('lets a monthly subscriber buy lifetime', async () => {
    mockFrom({
      profiles: mockChain({
        data: profile({
          billingInterval: 'month',
          stripeSubscriptionId: 'sub_1',
        }),
        error: null,
      }),
    })
    mockPrice()
    mockCheckoutSession()

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment' }),
    )
  })

  it('throws a 400 when the price is inactive', async () => {
    mockFrom({ profiles: mockChain({ data: profile(), error: null }) })
    mockPrice({ active: false })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Inactive price',
    })
  })

  it('throws a 400 when the product is not purchasable', async () => {
    mockFrom({ profiles: mockChain({ data: profile(), error: null }) })
    mockPrice({
      product: {
        id: 'prod_1',
        name: 'Free',
        deleted: false,
        metadata: { tier: 'free' },
      },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws when persisting the new customer fails', async () => {
    mockFrom({
      profiles: [
        mockChain({ data: profile({ stripeId: null }), error: null }),
        mockChain({ error: { message: 'boom' } }),
      ],
    })
    mockPrice()
    mockCheckoutSession()
    vi.spyOn(stripe.customers, 'create').mockResolvedValue({
      id: 'cus_new',
    } as never)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to start checkout.' })

    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('throws when saving the checkout session fails', async () => {
    mockFrom({
      profiles: [
        mockChain({ data: profile(), error: null }),
        mockChain({ error: { message: 'boom' } }),
      ],
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
