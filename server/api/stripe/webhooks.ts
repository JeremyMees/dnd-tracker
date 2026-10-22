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

const HANDLED_TYPE_SET = new Set<string>(HANDLED_TYPES)

function isHandled(stripeEvent: Stripe.Event): stripeEvent is HandledEvent {
  return HANDLED_TYPE_SET.has(stripeEvent.type)
}

async function handleEvent(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  profile: BillingProfile,
  stripeEvent: HandledEvent,
): Promise<string | undefined> {
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      return completeCheckout(supabase, profile, stripeEvent.data.object)
    }
    case 'checkout.session.async_payment_failed': {
      return `Payment failed for session ${stripeEvent.data.object.id}`
    }
    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object
      const ignored = guardSubscription(profile, subscription.id)

      if (ignored) return ignored

      await syncSubscription(supabase, profile, subscription)
      return undefined
    }
    case 'customer.subscription.deleted': {
      const ignored = guardSubscription(profile, stripeEvent.data.object.id)

      if (ignored) return ignored

      await updateBillingProfile(supabase, profile.id, {
        subscriptionType: 'free',
        billingInterval: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
      return undefined
    }
    case 'invoice.paid': {
      const subscriptionId = resolveInvoiceSubscription(stripeEvent.data.object)

      if (!subscriptionId) return 'Ignoring invoice without a subscription'

      const ignored = guardSubscription(profile, subscriptionId)

      if (ignored) return ignored

      await syncSubscription(
        supabase,
        profile,
        await stripe.subscriptions.retrieve(subscriptionId),
      )
      return undefined
    }
    case 'invoice.payment_failed': {
      const subscriptionId = resolveInvoiceSubscription(stripeEvent.data.object)

      if (!subscriptionId) return 'Ignoring invoice without a subscription'

      const ignored = guardSubscription(profile, subscriptionId)

      if (ignored) return ignored

      await updateBillingProfile(supabase, profile.id, {
        subscriptionStatus: 'past_due',
      })
      return undefined
    }
  }
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

  const result = await handleEvent(supabase, profile, stripeEvent)

  return result ?? `handled ${stripeEvent.type}`
})
