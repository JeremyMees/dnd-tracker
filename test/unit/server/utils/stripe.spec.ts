import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stripe } from 'stripe'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockStorage, useStorage } from '~~/test/unit/stubs/storage'
import {
  resolveProduct,
  resolveTier,
  resolveInterval,
  resolveStatus,
  isEntitled,
  resolvePeriodEnd,
  resolveInvoiceSubscription,
  resolveSubscriptionTier,
  assertStripeIp,
  stripe,
} from '~~/server/utils/stripe'

function mockFetchOk(ips: string[]) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({ WEBHOOKS: ips }),
  }))
}

vi.mock('#app', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRuntimeConfig: () => ({ stripeApiKey: 'sk_test_stub' }),
}))

function createProduct(metadata: Record<string, string> = {}): Stripe.Product {
  return {
    id: 'prod_123',
    object: 'product',
    name: 'Pro',
    active: true,
    metadata,
  } as Stripe.Product
}

function createPrice(type: Stripe.Price.Type): Stripe.Price {
  return {
    id: 'price_123',
    object: 'price',
    active: true,
    type,
  } as Stripe.Price
}

describe('stripe', () => {
  describe('resolveProduct', () => {
    it('returns the product when it is expanded', () => {
      const product = createProduct()

      expect(resolveProduct(product)).toBe(product)
    })

    it('throws a 400 when the product is not expanded', () => {
      expect(() => resolveProduct('prod_123')).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Unknown product',
        }),
      )
    })

    it('throws a 400 when the product is missing', () => {
      expect(() => resolveProduct(null)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
      expect(() => resolveProduct(undefined)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })

    it('throws a 400 when the product is deleted', () => {
      const deleted = {
        id: 'prod_123',
        object: 'product',
        deleted: true,
      } as Stripe.DeletedProduct

      expect(() => resolveProduct(deleted)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })
  })

  describe('resolveTier', () => {
    it('resolves the pro tier from the product metadata', () => {
      expect(resolveTier(createProduct({ tier: 'pro' }))).toBe('pro')
    })

    it('throws a 400 when the metadata holds another tier', () => {
      expect(() => resolveTier(createProduct({ tier: 'free' }))).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Product "Pro" is not purchasable',
        }),
      )
    })

    it('throws a 400 when the tier metadata is missing', () => {
      expect(() => resolveTier(createProduct())).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Product "Pro" is not purchasable',
        }),
      )
    })

    it('does not normalise casing or padding', () => {
      expect(() => resolveTier(createProduct({ tier: 'Pro' }))).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
      expect(() => resolveTier(createProduct({ tier: ' pro ' }))).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })
  })

  describe('resolveInterval', () => {
    it('resolves a monthly interval for recurring prices', () => {
      expect(resolveInterval(createPrice('recurring'))).toBe('month')
    })

    it('resolves a lifetime interval for one time prices', () => {
      expect(resolveInterval(createPrice('one_time'))).toBe('lifetime')
    })
  })

  describe('resolveStatus', () => {
    it.each([
      ['active', 'active'],
      ['trialing', 'trialing'],
      ['past_due', 'past_due'],
      ['canceled', 'canceled'],
      ['unpaid', 'unpaid'],
      ['incomplete', 'incomplete'],
    ] as const)('keeps %s as is', (status, expected) => {
      expect(resolveStatus(status)).toBe(expected)
    })

    it.each(['incomplete_expired', 'paused'] as const)(
      'maps %s to canceled because the database has no such status',
      status => {
        expect(resolveStatus(status)).toBe('canceled')
      },
    )

    it('returns null for a status the SDK does not know yet', () => {
      expect(resolveStatus('some_future_status')).toBeNull()
    })
  })

  describe('isEntitled', () => {
    it.each(['active', 'trialing', 'past_due'] as const)(
      'grants access while %s',
      status => {
        expect(isEntitled(status)).toBe(true)
      },
    )

    it.each(['canceled', 'unpaid', 'incomplete'] as const)(
      'denies access while %s',
      status => {
        expect(isEntitled(status)).toBe(false)
      },
    )
  })

  describe('resolvePeriodEnd', () => {
    it('reads the period end off the first subscription item', () => {
      const subscription = {
        items: { data: [{ current_period_end: 1893456000 }] },
      } as Stripe.Subscription

      expect(resolvePeriodEnd(subscription)).toBe('2030-01-01T00:00:00.000Z')
    })

    it('ignores a period end on the subscription itself', () => {
      const subscription = {
        current_period_end: 1000000000,
        items: { data: [{ current_period_end: 1893456000 }] },
      } as unknown as Stripe.Subscription

      expect(resolvePeriodEnd(subscription)).toBe('2030-01-01T00:00:00.000Z')
    })

    it('returns null when the subscription has no items', () => {
      const subscription = {
        items: { data: [] },
      } as unknown as Stripe.Subscription

      expect(resolvePeriodEnd(subscription)).toBeNull()
    })
  })

  describe('resolveInvoiceSubscription', () => {
    it('reads the id from a string reference', () => {
      const invoice = {
        parent: { subscription_details: { subscription: 'sub_1' } },
      } as Stripe.Invoice

      expect(resolveInvoiceSubscription(invoice)).toBe('sub_1')
    })

    it('reads the id from an expanded subscription', () => {
      const invoice = {
        parent: { subscription_details: { subscription: { id: 'sub_1' } } },
      } as unknown as Stripe.Invoice

      expect(resolveInvoiceSubscription(invoice)).toBe('sub_1')
    })

    it('returns null for an invoice without a subscription parent', () => {
      expect(
        resolveInvoiceSubscription({ parent: null } as Stripe.Invoice),
      ).toBeNull()
      expect(
        resolveInvoiceSubscription({
          parent: { subscription_details: null },
        } as Stripe.Invoice),
      ).toBeNull()
    })
  })

  describe('resolveSubscriptionTier', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    function subscription(product: unknown): Stripe.Subscription {
      return {
        items: { data: [{ price: { product } }] },
      } as Stripe.Subscription
    }

    it('retrieves the product when the price only holds its id', async () => {
      const retrieve = vi
        .spyOn(stripe.products, 'retrieve')
        .mockResolvedValue({ name: 'Pro', metadata: { tier: 'pro' } } as never)

      await expect(
        resolveSubscriptionTier(subscription('prod_123')),
      ).resolves.toBe('pro')
      expect(retrieve).toHaveBeenCalledWith('prod_123')
    })

    it('uses an already expanded product without a lookup', async () => {
      const retrieve = vi.spyOn(stripe.products, 'retrieve')

      await expect(
        resolveSubscriptionTier(subscription(createProduct({ tier: 'pro' }))),
      ).resolves.toBe('pro')
      expect(retrieve).not.toHaveBeenCalled()
    })

    it('throws a 400 when the subscription has no items', async () => {
      const empty = { items: { data: [] } } as unknown as Stripe.Subscription

      await expect(resolveSubscriptionTier(empty)).rejects.toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Unknown product',
        }),
      )
    })

    it('throws a 400 when the product is not purchasable', async () => {
      vi.spyOn(stripe.products, 'retrieve').mockResolvedValue({
        name: 'Pro',
        metadata: {},
      } as never)

      await expect(
        resolveSubscriptionTier(subscription('prod_123')),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }))
    })
  })

  describe('assertStripeIp', () => {
    beforeEach(() => {
      mockStorage()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('allows a request from an IP on the published list', async () => {
      vi.stubGlobal('fetch', mockFetchOk(['1.2.3.4']))
      const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

      await expect(assertStripeIp(event)).resolves.toBeUndefined()
    })

    it('throws a 403 for an IP not on the published list', async () => {
      vi.stubGlobal('fetch', mockFetchOk(['1.2.3.4']))
      const event = mockEvent({ headers: { 'x-forwarded-for': '9.9.9.9' } })

      await expect(assertStripeIp(event)).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden',
      })
    })

    it('caches the published list instead of fetching on every request', async () => {
      const fetchMock = mockFetchOk(['1.2.3.4'])
      vi.stubGlobal('fetch', fetchMock)
      const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

      await assertStripeIp(event)
      await assertStripeIp(event)

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('falls back to a stale cached list when a refetch fails', async () => {
      await useStorage('stripe-ips').setItem('webhooks', {
        ips: ['1.2.3.4'],
        expiresAt: Date.now() - 1,
      })
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new Error('network down'))),
      )
      const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

      await expect(assertStripeIp(event)).resolves.toBeUndefined()
    })

    it('fails open when the list cannot be resolved at all', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new Error('network down'))),
      )
      const event = mockEvent({ headers: { 'x-forwarded-for': '9.9.9.9' } })

      await expect(assertStripeIp(event)).resolves.toBeUndefined()
    })
  })
})
