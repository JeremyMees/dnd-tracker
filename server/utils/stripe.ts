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

export function isUpgradeProduct(name: string): boolean {
  return name.trim().toLowerCase() === 'upgrade to pro'
}

export function resolveTier(name: string): 'medior' | 'pro' {
  switch (name.trim().toLowerCase()) {
    case 'medior':
      return 'medior'
    case 'pro':
    case 'upgrade to pro':
      return 'pro'
    default:
      throw createError({
        statusCode: 400,
        statusMessage: `Product "${name}" is not purchasable`,
      })
  }
}
