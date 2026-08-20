import { Stripe } from 'stripe'
import type { H3Event } from 'h3'

export const stripe = new Stripe(useRuntimeConfig().stripeApiKey, {
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

const STRIPE_IPS_URL = 'https://stripe.com/files/ips/ips_webhooks.json'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface StripeIpCache {
  ips: string[]
  expiresAt: number
}

async function fetchStripeIps(): Promise<string[]> {
  const response = await fetch(STRIPE_IPS_URL)

  if (!response.ok) throw new Error('Failed to fetch Stripe IPs')

  const body = (await response.json()) as { WEBHOOKS: string[] }

  return body.WEBHOOKS
}

async function resolveStripeIps(): Promise<string[] | null> {
  const storage = useStorage<StripeIpCache>('stripe-ips')
  const cached = await storage.getItem('webhooks')
  const now = Date.now()

  if (cached && cached.expiresAt > now) return cached.ips

  try {
    const ips = await fetchStripeIps()

    await storage.setItem('webhooks', { ips, expiresAt: now + CACHE_TTL_MS })

    return ips
  } catch {
    return cached?.ips ?? null
  }
}

export async function assertStripeIp(event: H3Event): Promise<void> {
  if (import.meta.dev) return

  const ip = getRequestIP(event, { xForwardedFor: true })
  const allowed = await resolveStripeIps()

  if (!allowed) return

  if (!ip || !allowed.includes(ip)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}
