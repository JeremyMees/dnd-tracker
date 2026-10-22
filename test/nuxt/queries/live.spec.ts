import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearQueryCache, fetchMock, mountHook } from '~~/test/nuxt/stubs/query'
import { useLiveState } from '~/queries/live'

describe('live queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useLiveState', () => {
    it('fetches the live state with the token and seat token as query params', async () => {
      fetchMock.mockResolvedValue({ sheet: {}, session: {} })

      const { vm } = await mountHook(() =>
        useLiveState(
          computed(() => 'token'),
          computed(() => 'seat-token'),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/state', {
        query: { token: 'token', seatToken: 'seat-token' },
      })
    })

    it('does not fetch without a token', async () => {
      const { vm } = await mountHook(() =>
        useLiveState(
          computed(() => undefined),
          computed(() => undefined),
        ),
      )

      expect(vm.fetchStatus).toBe('idle')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it.each([404, 410])(
      'does not retry once the session is gone (%i)',
      async statusCode => {
        fetchMock.mockRejectedValue({ statusCode })

        const { vm } = await mountHook(() =>
          useLiveState(
            computed(() => 'token'),
            computed(() => 'seat-token'),
          ),
        )

        await vi.waitFor(() => expect(vm.isError).toBe(true))

        expect(fetchMock).toHaveBeenCalledTimes(1)
      },
    )

    it('retries a transient failure', async () => {
      fetchMock
        .mockRejectedValueOnce({ statusCode: 500 })
        .mockResolvedValue({ sheet: {}, session: {} })

      const { vm } = await mountHook(() =>
        useLiveState(
          computed(() => 'token'),
          computed(() => 'seat-token'),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined(), { timeout: 3000 })

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(vm.isError).toBe(false)
    })
  })
})
