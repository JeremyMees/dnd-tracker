import { serverSupabaseServiceRole } from '#supabase/server'
import type { Stripe } from 'stripe'

const HANDLED_TYPES = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
] as const

type HandledEvent = Extract<
  Stripe.Event,
  { type: (typeof HANDLED_TYPES)[number] }
>

function isHandled(stripeEvent: Stripe.Event): stripeEvent is HandledEvent {
  return HANDLED_TYPES.some(type => type === stripeEvent.type)
}

export default defineEventHandler(async event => {
  await assertStripeIp(event)

  const raw = (await readRawBody(event)) as string
  const signature = getHeader(event, 'stripe-signature') || ''
  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole<DB>(event)

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      raw,
      signature,
      config.stripeWebhook,
    )
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  if (!isHandled(stripeEvent)) {
    return `Unhandled event type: ${stripeEvent.type}`
  }

  const customer = stripeEvent.data.object.customer

  if (typeof customer !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer' })
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, subscriptionType, billingInterval, stripeSubscriptionId')
    .eq('stripeId', customer)
    .maybeSingle()

  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: 'Lookup failed' })
  }

  if (!profile) return 'No profile for this customer'

  const { id, subscriptionType, billingInterval, stripeSubscriptionId } =
    profile

  async function updateProfile(values: ProfileUpdate) {
    const { error } = await supabase
      .from('profiles')
      .update(values)
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Update failed' })
    }
  }

  function guardSubscription(subscriptionId: string) {
    if (billingInterval === 'lifetime') return 'lifetime, ignoring'
    if (subscriptionId !== stripeSubscriptionId) return 'stale subscription'
  }

  async function syncSubscription(subscription: Stripe.Subscription) {
    const status = resolveStatus(subscription.status)
    const values: ProfileUpdate = {
      subscriptionPeriodEnd: resolvePeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }

    if (status) {
      values.subscriptionStatus = status

      if (!isEntitled(status)) {
        values.subscriptionType = 'free'
        values.billingInterval = null
        values.subscriptionPeriodEnd = null
        values.cancelAtPeriodEnd = false
      } else if (subscriptionType === 'free') {
        values.subscriptionType = await resolveSubscriptionTier(subscription)
      }
    }

    await updateProfile(values)
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = stripeEvent.data.object

      if (session.payment_status === 'unpaid') {
        return `Awaiting payment for session ${session.id}`
      }

      const items = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
        expand: ['data.price.product'],
      })

      const tier = resolveTier(resolveProduct(items.data[0]?.price?.product))

      if (session.mode === 'payment') {
        await updateProfile({
          subscriptionType: tier,
          billingInterval: 'lifetime',
          subscriptionStatus: null,
          subscriptionPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })

        if (stripeSubscriptionId) {
          await cancelSubscriptionIfActive(stripeSubscriptionId)
          await updateProfile({ stripeSubscriptionId: null })
        }
      } else if (session.mode === 'subscription') {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        )

        await updateProfile({
          subscriptionType: tier,
          billingInterval: 'month',
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: resolveStatus(subscription.status),
          subscriptionPeriodEnd: resolvePeriodEnd(subscription),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
      } else {
        return `Ignoring session with mode ${session.mode}`
      }

      break
    }
    case 'checkout.session.async_payment_failed': {
      return `Payment failed for session ${stripeEvent.data.object.id}`
    }
    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object
      const ignored = guardSubscription(subscription.id)

      if (ignored) return ignored

      await syncSubscription(subscription)
      break
    }
    case 'customer.subscription.deleted': {
      const ignored = guardSubscription(stripeEvent.data.object.id)

      if (ignored) return ignored

      await updateProfile({
        subscriptionType: 'free',
        billingInterval: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
      break
    }
    case 'invoice.paid': {
      const subscriptionId = resolveInvoiceSubscription(stripeEvent.data.object)

      if (!subscriptionId) return 'Ignoring invoice without a subscription'

      const ignored = guardSubscription(subscriptionId)

      if (ignored) return ignored

      await syncSubscription(
        await stripe.subscriptions.retrieve(subscriptionId),
      )
      break
    }
    case 'invoice.payment_failed': {
      const subscriptionId = resolveInvoiceSubscription(stripeEvent.data.object)

      if (!subscriptionId) return 'Ignoring invoice without a subscription'

      const ignored = guardSubscription(subscriptionId)

      if (ignored) return ignored

      await updateProfile({ subscriptionStatus: 'past_due' })
      break
    }
  }

  return `handled ${stripeEvent.type}`
})
