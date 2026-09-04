import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockStorage } from '~~/test/unit/stubs/storage'
import { stripe } from '~~/server/utils/stripe'
import handler from '~~/server/api/stripe/webhooks'

vi.mock('~~/server/utils/stripe', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  assertStripeIp: vi.fn().mockResolvedValue(undefined),
}))

function webhookEvent(stripeEvent: Record<string, unknown>) {
  vi.spyOn(stripe.webhooks, 'constructEvent').mockReturnValue(
    stripeEvent as never,
  )

  return mockEvent({
    method: 'POST',
    body: JSON.stringify(stripeEvent),
    headers: { 'stripe-signature': 'test-signature' },
  })
}

function checkoutCompletedEvent(
  overrides: Record<string, unknown> = {},
  type = 'checkout.session.completed',
) {
  return {
    type,
    data: {
      object: {
        id: 'cs_1',
        customer: 'cus_1',
        payment_status: 'paid',
        mode: 'payment',
        ...overrides,
      },
    },
  }
}

function subscriptionEvent(
  type: 'customer.subscription.updated' | 'customer.subscription.deleted',
  overrides: Record<string, unknown> = {},
) {
  return {
    type,
    data: {
      object: {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ current_period_end: 1893456000 }] },
        ...overrides,
      },
    },
  }
}

function invoiceEvent(
  type: 'invoice.paid' | 'invoice.payment_failed',
  subscription: unknown = 'sub_1',
) {
  return {
    type,
    data: {
      object: {
        id: 'in_1',
        customer: 'cus_1',
        parent: subscription
          ? { subscription_details: { subscription } }
          : null,
      },
    },
  }
}

function mockLineItems() {
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

function mockProduct() {
  return vi.spyOn(stripe.products, 'retrieve').mockResolvedValue({
    id: 'prod_1',
    name: 'Pro',
    metadata: { tier: 'pro' },
  } as never)
}

function mockSubscription(overrides: Record<string, unknown> = {}) {
  return vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
    id: 'sub_1',
    status: 'active',
    cancel_at_period_end: false,
    items: { data: [{ current_period_end: 1893456000 }] },
    ...overrides,
  } as never)
}

function mockProfile(profile: Record<string, unknown> | null) {
  const update = mockChain({ error: null })

  mockFrom({
    profiles: [mockChain({ data: profile, error: null }), update, update],
  })

  return update
}

const freeProfile = {
  id: 'profile-1',
  subscriptionType: 'free',
  billingInterval: null,
  stripeSubscriptionId: null,
}

const monthlyProfile = {
  id: 'profile-1',
  subscriptionType: 'pro',
  billingInterval: 'month',
  stripeSubscriptionId: 'sub_1',
}

const lapsedProfile = {
  id: 'profile-1',
  subscriptionType: 'free',
  billingInterval: 'month',
  stripeSubscriptionId: 'sub_1',
}

const lifetimeProfile = {
  id: 'profile-1',
  subscriptionType: 'pro',
  billingInterval: 'lifetime',
  stripeSubscriptionId: null,
}

describe('POST /api/stripe/webhooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockStorage()
    mockRuntimeConfig({ stripeWebhook: 'whsec_test' })
  })

  describe('checkout.session.completed', () => {
    it('stores the subscription for a monthly checkout', async () => {
      mockLineItems()
      mockSubscription()
      const update = mockProfile(freeProfile)

      await expect(
        handler(
          webhookEvent(
            checkoutCompletedEvent({
              mode: 'subscription',
              subscription: 'sub_1',
            }),
          ),
        ),
      ).resolves.toBe('handled checkout.session.completed')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'pro',
        billingInterval: 'month',
        stripeSubscriptionId: 'sub_1',
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('stores a lifetime purchase and clears the subscription columns', async () => {
      mockLineItems()
      const update = mockProfile(freeProfile)

      await expect(
        handler(webhookEvent(checkoutCompletedEvent())),
      ).resolves.toBe('handled checkout.session.completed')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'pro',
        billingInterval: 'lifetime',
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    })

    it('cancels an active subscription after the lifetime row is written', async () => {
      mockLineItems()
      mockSubscription()
      const cancel = vi
        .spyOn(stripe.subscriptions, 'cancel')
        .mockResolvedValue({} as never)
      const update = mockProfile(monthlyProfile)
      const calls: string[] = []

      update.update.mockImplementation(() => {
        calls.push('update')
        return update
      })
      cancel.mockImplementation(() => {
        calls.push('cancel')
        return Promise.resolve({}) as never
      })

      await handler(webhookEvent(checkoutCompletedEvent()))

      expect(cancel).toHaveBeenCalledWith('sub_1')
      expect(calls).toStrictEqual(['update', 'cancel', 'update'])
      expect(update.update).toHaveBeenLastCalledWith({
        stripeSubscriptionId: null,
      })
    })

    it('keeps the subscription id when the cancel fails so a retry can finish', async () => {
      mockLineItems()
      mockSubscription()
      vi.spyOn(stripe.subscriptions, 'cancel').mockRejectedValue(
        new Error('stripe unavailable'),
      )
      const update = mockProfile(monthlyProfile)

      await expect(
        handler(webhookEvent(checkoutCompletedEvent())),
      ).rejects.toThrow('stripe unavailable')

      expect(update.update).not.toHaveBeenCalledWith({
        stripeSubscriptionId: null,
      })
    })

    it('clears the subscription id when it was already canceled', async () => {
      mockLineItems()
      mockSubscription({ status: 'canceled' })
      const cancel = vi.spyOn(stripe.subscriptions, 'cancel')
      const update = mockProfile(monthlyProfile)

      await handler(webhookEvent(checkoutCompletedEvent()))

      expect(cancel).not.toHaveBeenCalled()
      expect(update.update).toHaveBeenLastCalledWith({
        stripeSubscriptionId: null,
      })
    })

    it('does not cancel anything when there is no subscription', async () => {
      mockLineItems()
      const cancel = vi.spyOn(stripe.subscriptions, 'cancel')
      mockProfile(freeProfile)

      await handler(webhookEvent(checkoutCompletedEvent()))

      expect(cancel).not.toHaveBeenCalled()
    })

    it('waits for a delayed payment instead of fulfilling', async () => {
      mockProfile(freeProfile)

      await expect(
        handler(
          webhookEvent(checkoutCompletedEvent({ payment_status: 'unpaid' })),
        ),
      ).resolves.toBe('Awaiting payment for session cs_1')
    })

    it('fulfills a session that required no payment', async () => {
      mockLineItems()
      const update = mockProfile(freeProfile)

      await handler(
        webhookEvent(
          checkoutCompletedEvent({ payment_status: 'no_payment_required' }),
        ),
      )

      expect(update.update).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionType: 'pro' }),
      )
    })

    it('fulfills when a delayed payment later succeeds', async () => {
      mockLineItems()
      const update = mockProfile(freeProfile)

      await expect(
        handler(
          webhookEvent(
            checkoutCompletedEvent(
              {},
              'checkout.session.async_payment_succeeded',
            ),
          ),
        ),
      ).resolves.toBe('handled checkout.session.async_payment_succeeded')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'pro',
        billingInterval: 'lifetime',
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    })

    it('grants nothing when a delayed payment fails', async () => {
      const update = mockProfile(freeProfile)

      await expect(
        handler(
          webhookEvent(
            checkoutCompletedEvent({}, 'checkout.session.async_payment_failed'),
          ),
        ),
      ).resolves.toBe('Payment failed for session cs_1')

      expect(update.update).not.toHaveBeenCalled()
    })

    it('ignores sessions with an unsupported mode', async () => {
      mockLineItems()
      mockProfile(freeProfile)

      await expect(
        handler(webhookEvent(checkoutCompletedEvent({ mode: 'setup' }))),
      ).resolves.toBe('Ignoring session with mode setup')
    })
  })

  describe('customer.subscription.updated', () => {
    it('writes the status and period end', async () => {
      const update = mockProfile(monthlyProfile)

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.updated')),
        ),
      ).resolves.toBe('handled customer.subscription.updated')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('keeps entitlement while a payment is being retried', async () => {
      const update = mockProfile(monthlyProfile)

      await handler(
        webhookEvent(
          subscriptionEvent('customer.subscription.updated', {
            status: 'past_due',
          }),
        ),
      )

      expect(update.update).toHaveBeenCalledWith({
        subscriptionStatus: 'past_due',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('drops to free when the status is no longer entitled', async () => {
      const update = mockProfile(monthlyProfile)

      await handler(
        webhookEvent(
          subscriptionEvent('customer.subscription.updated', {
            status: 'unpaid',
          }),
        ),
      )

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'free',
        subscriptionStatus: 'unpaid',
        billingInterval: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    })

    it('restores the tier when a lapsed subscription recovers', async () => {
      const product = mockProduct()
      const update = mockProfile(lapsedProfile)

      await handler(
        webhookEvent(
          subscriptionEvent('customer.subscription.updated', {
            items: {
              data: [
                {
                  current_period_end: 1893456000,
                  price: { product: 'prod_1' },
                },
              ],
            },
          }),
        ),
      )

      expect(product).toHaveBeenCalledWith('prod_1')
      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'pro',
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('does not look up the product for a profile that is already pro', async () => {
      const product = mockProduct()
      mockProfile(monthlyProfile)

      await handler(
        webhookEvent(subscriptionEvent('customer.subscription.updated')),
      )

      expect(product).not.toHaveBeenCalled()
    })

    it('leaves entitlement alone for a status the SDK does not know', async () => {
      const update = mockProfile(monthlyProfile)

      await handler(
        webhookEvent(
          subscriptionEvent('customer.subscription.updated', {
            status: 'some_future_status',
          }),
        ),
      )

      expect(update.update).toHaveBeenCalledWith({
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('maps statuses the database does not know to canceled and clears billing', async () => {
      const update = mockProfile(monthlyProfile)

      await handler(
        webhookEvent(
          subscriptionEvent('customer.subscription.updated', {
            status: 'paused',
          }),
        ),
      )

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'free',
        subscriptionStatus: 'canceled',
        billingInterval: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    })

    it('ignores the event for a lifetime profile', async () => {
      mockProfile(lifetimeProfile)

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.updated')),
        ),
      ).resolves.toBe('lifetime, ignoring')
    })

    it('ignores an event from a superseded subscription', async () => {
      mockProfile({ ...monthlyProfile, stripeSubscriptionId: 'sub_2' })

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.updated')),
        ),
      ).resolves.toBe('stale subscription')
    })
  })

  describe('customer.subscription.deleted', () => {
    it('drops the profile to free and clears the billing columns', async () => {
      const update = mockProfile(monthlyProfile)

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.deleted')),
        ),
      ).resolves.toBe('handled customer.subscription.deleted')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'free',
        billingInterval: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    })

    it('does not downgrade a profile that just bought lifetime', async () => {
      mockProfile(lifetimeProfile)

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.deleted')),
        ),
      ).resolves.toBe('lifetime, ignoring')
    })

    it('ignores a deletion for a subscription the profile no longer holds', async () => {
      mockProfile({ ...monthlyProfile, stripeSubscriptionId: 'sub_2' })

      await expect(
        handler(
          webhookEvent(subscriptionEvent('customer.subscription.deleted')),
        ),
      ).resolves.toBe('stale subscription')
    })
  })

  describe('invoice.payment_failed', () => {
    it('marks the subscription past due without touching entitlement', async () => {
      const update = mockProfile(monthlyProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.payment_failed'))),
      ).resolves.toBe('handled invoice.payment_failed')

      expect(update.update).toHaveBeenCalledWith({
        subscriptionStatus: 'past_due',
      })
    })

    it('reads the subscription from an expanded parent', async () => {
      const update = mockProfile(monthlyProfile)

      await handler(
        webhookEvent(invoiceEvent('invoice.payment_failed', { id: 'sub_1' })),
      )

      expect(update.update).toHaveBeenCalledWith({
        subscriptionStatus: 'past_due',
      })
    })

    it('ignores invoices that belong to no subscription', async () => {
      mockProfile(monthlyProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.payment_failed', null))),
      ).resolves.toBe('Ignoring invoice without a subscription')
    })

    it('ignores invoices for a lifetime profile', async () => {
      mockProfile(lifetimeProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.payment_failed'))),
      ).resolves.toBe('lifetime, ignoring')
    })
  })

  describe('invoice.paid', () => {
    it('resyncs the subscription after a renewal is paid', async () => {
      const retrieve = mockSubscription()
      const update = mockProfile(monthlyProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.paid'))),
      ).resolves.toBe('handled invoice.paid')

      expect(retrieve).toHaveBeenCalledWith('sub_1')
      expect(update.update).toHaveBeenCalledWith({
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('restores the tier when a lapsed subscription is paid off', async () => {
      mockSubscription({
        items: {
          data: [
            { current_period_end: 1893456000, price: { product: 'prod_1' } },
          ],
        },
      })
      const product = mockProduct()
      const update = mockProfile(lapsedProfile)

      await handler(webhookEvent(invoiceEvent('invoice.paid')))

      expect(product).toHaveBeenCalledWith('prod_1')
      expect(update.update).toHaveBeenCalledWith({
        subscriptionType: 'pro',
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: '2030-01-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      })
    })

    it('ignores invoices that belong to no subscription', async () => {
      mockProfile(monthlyProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.paid', null))),
      ).resolves.toBe('Ignoring invoice without a subscription')
    })

    it('ignores the first invoice of a checkout that is not stored yet', async () => {
      const retrieve = mockSubscription()
      mockProfile(freeProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.paid'))),
      ).resolves.toBe('stale subscription')

      expect(retrieve).not.toHaveBeenCalled()
    })

    it('ignores invoices for a lifetime profile', async () => {
      mockProfile(lifetimeProfile)

      await expect(
        handler(webhookEvent(invoiceEvent('invoice.paid'))),
      ).resolves.toBe('lifetime, ignoring')
    })
  })

  it('ignores unhandled event types', async () => {
    await expect(
      handler(webhookEvent({ type: 'customer.updated', data: { object: {} } })),
    ).resolves.toBe('Unhandled event type: customer.updated')
  })

  it('returns a message when no profile matches the customer', async () => {
    mockProfile(null)

    await expect(handler(webhookEvent(checkoutCompletedEvent()))).resolves.toBe(
      'No profile for this customer',
    )
  })

  it('throws a 400 when the customer is not a string', async () => {
    await expect(
      handler(webhookEvent(checkoutCompletedEvent({ customer: null }))),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid customer',
    })
  })

  it('throws a 400 for an invalid signature', async () => {
    vi.spyOn(stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('bad signature')
    })

    await expect(
      handler(
        mockEvent({
          method: 'POST',
          body: '{}',
          headers: { 'stripe-signature': 'bad' },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid signature',
    })
  })

  it('throws a 500 when the profile lookup fails', async () => {
    mockFrom({
      profiles: mockChain({ data: null, error: { message: 'boom' } }),
    })

    await expect(
      handler(webhookEvent(checkoutCompletedEvent())),
    ).rejects.toMatchObject({ statusCode: 500, statusMessage: 'Lookup failed' })
  })

  it('throws a 500 when the profile update fails', async () => {
    mockLineItems()
    mockFrom({
      profiles: [
        mockChain({ data: freeProfile, error: null }),
        mockChain({ error: { message: 'boom' } }),
      ],
    })

    await expect(
      handler(webhookEvent(checkoutCompletedEvent())),
    ).rejects.toMatchObject({ statusCode: 500, statusMessage: 'Update failed' })
  })
})
