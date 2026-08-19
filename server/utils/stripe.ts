import { Stripe } from 'stripe'

export const stripe = new Stripe(useRuntimeConfig().stripeSk, {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
})

export const CHECKOUT_INTEGRATION_ID = 'dnd-tracker-subscribe-tqwyhero'

export function resolveProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct | null | undefined,
): Stripe.Product {
  if (!product || typeof product === 'string' || product.deleted) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown product' })
  }

  return product
}

export function resolveTier(product: Stripe.Product): SubscriptionType {
  const tier = product.metadata.tier

  if (tier !== 'pro') {
    throw createError({
      statusCode: 400,
      statusMessage: `Product "${product.name}" is not purchasable`,
    })
  }

  return tier
}

export function resolveInterval(price: Stripe.Price): BillingInterval {
  return price.type === 'recurring' ? 'month' : 'lifetime'
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled',
  paused: 'canceled',
}

const ENTITLED_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
]

export function resolveStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus | null {
  return STATUS_MAP[status] ?? null
}

export function isEntitled(status: SubscriptionStatus): boolean {
  return ENTITLED_STATUSES.includes(status)
}

export function resolvePeriodEnd(
  subscription: Stripe.Subscription,
): string | null {
  const end = subscription.items.data[0]?.current_period_end

  return end ? new Date(end * 1000).toISOString() : null
}

export function resolveInvoiceSubscription(
  invoice: Stripe.Invoice,
): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription

  if (!subscription) return null

  return typeof subscription === 'string' ? subscription : subscription.id
}

export async function resolveSubscriptionTier(
  subscription: Stripe.Subscription,
): Promise<SubscriptionType> {
  const product = subscription.items.data[0]?.price.product

  return resolveTier(
    resolveProduct(
      typeof product === 'string'
        ? await stripe.products.retrieve(product)
        : product,
    ),
  )
}
