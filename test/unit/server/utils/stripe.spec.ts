import { describe, expect, it, vi } from 'vitest'
import type { Stripe } from 'stripe'
import {
  resolveProduct,
  isUpgradeProduct,
  resolveTier,
} from '~~/server/utils/stripe'

vi.mock('#app', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRuntimeConfig: () => ({ stripeSk: 'sk_test_stub' }),
}))

const product = {
  id: 'prod_123',
  object: 'product',
  name: 'Pro',
  active: true,
} as Stripe.Product

describe('stripe', () => {
  describe('resolveProduct', () => {
    it('returns the product when it is expanded', () => {
      expect(resolveProduct(product)).toBe(product)
    })

    it('throws a 400 when the product is not expanded', () => {
      expect(() => resolveProduct('prod_123')).toThrowError(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Unknown product',
        }),
      )
    })

    it('throws a 400 when the product is missing', () => {
      expect(() => resolveProduct(null)).toThrowError(
        expect.objectContaining({ statusCode: 400 }),
      )
      expect(() => resolveProduct(undefined)).toThrowError(
        expect.objectContaining({ statusCode: 400 }),
      )
    })

    it('throws a 400 when the product is deleted', () => {
      const deleted = {
        id: 'prod_123',
        object: 'product',
        deleted: true,
      } as Stripe.DeletedProduct

      expect(() => resolveProduct(deleted)).toThrowError(
        expect.objectContaining({ statusCode: 400 }),
      )
    })
  })

  describe('isUpgradeProduct', () => {
    it('matches the upgrade product regardless of casing or padding', () => {
      expect(isUpgradeProduct('Upgrade to Pro')).toBe(true)
      expect(isUpgradeProduct('  UPGRADE TO PRO  ')).toBe(true)
    })

    it('does not match other products', () => {
      expect(isUpgradeProduct('Pro')).toBe(false)
      expect(isUpgradeProduct('Medior')).toBe(false)
      expect(isUpgradeProduct('')).toBe(false)
    })
  })

  describe('resolveTier', () => {
    it('resolves the medior tier', () => {
      expect(resolveTier('Medior')).toBe('medior')
      expect(resolveTier(' medior ')).toBe('medior')
    })

    it('resolves the pro tier', () => {
      expect(resolveTier('Pro')).toBe('pro')
      expect(resolveTier('PRO')).toBe('pro')
    })

    it('resolves the upgrade product as the pro tier', () => {
      expect(resolveTier('Upgrade to Pro')).toBe('pro')
    })

    it('throws a 400 for products that are not purchasable', () => {
      expect(() => resolveTier('Free')).toThrowError(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Product "Free" is not purchasable',
        }),
      )
    })
  })
})
