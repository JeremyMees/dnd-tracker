import { describe, expect, it, vi } from 'vitest'
import type { Stripe } from 'stripe'
import {
  resolveProduct,
  resolveTier,
  resolveInterval,
} from '~~/server/utils/stripe'

vi.mock('#app', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRuntimeConfig: () => ({ stripeSk: 'sk_test_stub' }),
}))

function createProduct(metadata: Record<string, string> = {}): Stripe.Product {
  return {
    id: 'prod_123',
    object: 'product',
    name: 'Pro',
    active: true,
    metadata,
  } as Stripe.Product
}

function createPrice(type: Stripe.Price.Type): Stripe.Price {
  return {
    id: 'price_123',
    object: 'price',
    active: true,
    type,
  } as Stripe.Price
}

describe('stripe', () => {
  describe('resolveProduct', () => {
    it('returns the product when it is expanded', () => {
      const product = createProduct()

      expect(resolveProduct(product)).toBe(product)
    })

    it('throws a 400 when the product is not expanded', () => {
      expect(() => resolveProduct('prod_123')).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Unknown product',
        }),
      )
    })

    it('throws a 400 when the product is missing', () => {
      expect(() => resolveProduct(null)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
      expect(() => resolveProduct(undefined)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })

    it('throws a 400 when the product is deleted', () => {
      const deleted = {
        id: 'prod_123',
        object: 'product',
        deleted: true,
      } as Stripe.DeletedProduct

      expect(() => resolveProduct(deleted)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })
  })

  describe('resolveTier', () => {
    it('resolves the pro tier from the product metadata', () => {
      expect(resolveTier(createProduct({ tier: 'pro' }))).toBe('pro')
    })

    it('throws a 400 when the metadata holds another tier', () => {
      expect(() => resolveTier(createProduct({ tier: 'free' }))).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Product "Pro" is not purchasable',
        }),
      )
    })

    it('throws a 400 when the tier metadata is missing', () => {
      expect(() => resolveTier(createProduct())).toThrow(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Product "Pro" is not purchasable',
        }),
      )
    })

    it('does not normalise casing or padding', () => {
      expect(() => resolveTier(createProduct({ tier: 'Pro' }))).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
      expect(() => resolveTier(createProduct({ tier: ' pro ' }))).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    })
  })

  describe('resolveInterval', () => {
    it('resolves a monthly interval for recurring prices', () => {
      expect(resolveInterval(createPrice('recurring'))).toBe('month')
    })

    it('resolves a lifetime interval for one time prices', () => {
      expect(resolveInterval(createPrice('one_time'))).toBe('lifetime')
    })
  })
})
