import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { stripe } from '~~/server/utils/stripe'
import handler from '~~/server/api/stripe/webhooks'

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

function checkoutCompletedEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        customer: 'cus_1',
        payment_status: 'paid',
        ...overrides,
      },
    },
  }
}

describe('POST /api/stripe/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ stripeWebhook: 'whsec_test' })
  })

  it('updates the subscription tier for a completed checkout', async () => {
    vi.spyOn(stripe.checkout.sessions, 'listLineItems').mockResolvedValue({
      data: [
        { price: { product: { id: 'prod_1', name: 'Pro', deleted: false } } },
      ],
    } as never)
    const update = mockChain({ error: null })
    mockFrom({
      profiles: [mockChain({ data: { id: 'profile-1' }, error: null }), update],
    })

    await expect(handler(webhookEvent(checkoutCompletedEvent()))).resolves.toBe(
      'handled checkout.session.completed',
    )

    expect(update.update).toHaveBeenCalledWith({ subscriptionType: 'pro' })
  })

  it('ignores unhandled event types', async () => {
    await expect(
      handler(webhookEvent({ type: 'customer.updated', data: { object: {} } })),
    ).resolves.toBe('Unhandled event type: customer.updated')
  })

  it('ignores sessions that are not paid', async () => {
    await expect(
      handler(
        webhookEvent(checkoutCompletedEvent({ payment_status: 'unpaid' })),
      ),
    ).resolves.toBe('Ignoring session with payment_status unpaid')
  })

  it('returns a message when no profile matches the customer', async () => {
    vi.spyOn(stripe.checkout.sessions, 'listLineItems').mockResolvedValue({
      data: [
        { price: { product: { id: 'prod_1', name: 'Pro', deleted: false } } },
      ],
    } as never)
    mockFrom({ profiles: mockChain({ data: null, error: null }) })

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

  it('throws a 500 when updating the subscription tier fails', async () => {
    vi.spyOn(stripe.checkout.sessions, 'listLineItems').mockResolvedValue({
      data: [
        { price: { product: { id: 'prod_1', name: 'Pro', deleted: false } } },
      ],
    } as never)
    mockFrom({
      profiles: [
        mockChain({ data: { id: 'profile-1' }, error: null }),
        mockChain({ error: { message: 'boom' } }),
      ],
    })

    await expect(
      handler(webhookEvent(checkoutCompletedEvent())),
    ).rejects.toMatchObject({ statusCode: 500, statusMessage: 'Update failed' })
  })
})
