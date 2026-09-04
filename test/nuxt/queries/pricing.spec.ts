import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import { usePricingListing } from '~/queries/pricing'

describe('pricing queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('usePricingListing', () => {
    it('merges stripe prices into the matching default products', async () => {
      fetchMock.mockResolvedValue([
        { lookupKey: 'pro_monthly', price: 999, id: 'price_1' },
      ])

      const { vm } = await mountHook(() => usePricingListing())

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      const proMonthly = vm.data?.find(p => p.key === 'pro_monthly')
      const free = vm.data?.find(p => p.key === 'free')

      expect(proMonthly).toMatchObject({ price: 999, id: 'price_1' })
      expect(free).toMatchObject({ key: 'free', price: 0 })
      expect(free?.id).toBeUndefined()
    })

    it('shows the plain defaults as placeholder data while loading', async () => {
      fetchMock.mockImplementation(() => new Promise(() => {}))

      const { vm } = await mountHook(() => usePricingListing())

      expect(vm.data?.map(p => p.key)).toEqual([
        'free',
        'pro_monthly',
        'pro_lifetime',
      ])
    })

    it('toasts and settles into an error state when the fetch fails, without retrying', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(() => usePricingListing())

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
