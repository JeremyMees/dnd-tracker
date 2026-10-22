import { vi } from 'vitest'
import { stripe } from '~~/server/utils/stripe'

export function mockLineItems() {
  vi.spyOn(stripe.checkout.sessions, 'listLineItems').mockResolvedValue({
    data: [
      {
        price: {
          product: { id: 'prod_1', name: 'Pro', metadata: { tier: 'pro' } },
        },
      },
    ],
  } as never)
}

export function mockProduct() {
  return vi.spyOn(stripe.products, 'retrieve').mockResolvedValue({
    id: 'prod_1',
    name: 'Pro',
    metadata: { tier: 'pro' },
  } as never)
}

export function mockSubscription(overrides: Record<string, unknown> = {}) {
  return vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
    id: 'sub_1',
    status: 'active',
    cancel_at_period_end: false,
    items: { data: [{ current_period_end: 1893456000 }] },
    ...overrides,
  } as never)
}
