import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockStorage } from '~~/test/unit/stubs/storage'
import { stripe } from '~~/server/utils/stripe'
import handler from '~~/server/api/stripe/products.get'

function mockPrices(prices: Record<string, unknown>[]) {
  return vi
    .spyOn(stripe.prices, 'list')
    .mockResolvedValue({ data: prices } as never)
}

function price(overrides: Record<string, unknown> = {}) {
  return {
    id: 'price_1',
    lookup_key: 'pro_monthly',
    unit_amount: 999,
    type: 'recurring',
    product: { id: 'prod_1', name: 'Pro', metadata: { tier: 'pro' } },
    ...overrides,
  }
}

describe('GET /api/stripe/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage()
    mockRuntimeConfig({ stripeApiKey: 'sk_test_stub' })
  })

  it('returns the active prices with their expanded product', async () => {
    const list = mockPrices([price()])

    await expect(handler(mockEvent())).resolves.toEqual([
      {
        id: 'price_1',
        lookupKey: 'pro_monthly',
        price: 9.99,
        interval: 'month',
      },
    ])

    expect(list).toHaveBeenCalledWith({
      active: true,
      expand: ['data.product'],
    })
  })

  it('resolves a lifetime interval for one time prices', async () => {
    mockPrices([
      price({ id: 'price_2', lookup_key: 'pro_lifetime', type: 'one_time' }),
    ])

    await expect(handler(mockEvent())).resolves.toEqual([
      {
        id: 'price_2',
        lookupKey: 'pro_lifetime',
        price: 9.99,
        interval: 'lifetime',
      },
    ])
  })

  it('skips prices without a lookup key', async () => {
    mockPrices([
      price(),
      price({ id: 'price_2', lookup_key: null }),
      price({ id: 'price_3', lookup_key: '' }),
    ])

    await expect(handler(mockEvent())).resolves.toEqual([
      expect.objectContaining({ id: 'price_1' }),
    ])
  })

  it('falls back to a zero price when the amount is missing', async () => {
    mockPrices([price({ unit_amount: null })])

    await expect(handler(mockEvent())).resolves.toEqual([
      expect.objectContaining({ price: 0 }),
    ])
  })

  it('returns an empty list when there are no active prices', async () => {
    mockPrices([])

    await expect(handler(mockEvent())).resolves.toEqual([])
  })
})
