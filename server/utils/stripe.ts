import { Stripe } from 'stripe'

export const stripe = new Stripe(useRuntimeConfig().stripeSk, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

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
