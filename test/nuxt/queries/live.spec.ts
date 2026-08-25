import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearQueryCache, fetchMock, mountHook } from '~~/test/nuxt/stubs/query'
import { liveStateQueryKey, useLiveState } from '~/queries/live'

describe('live queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('liveStateQueryKey', () => {
    it('builds a key from the token and seat token', () => {
      expect(liveStateQueryKey('token', 'seat-token')).toEqual([
        'useLiveState',
        'token',
        'seat-token',
      ])
    })
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

    it('does not retry on failure', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountHook(() =>
        useLiveState(
          computed(() => 'token'),
          computed(() => 'seat-token'),
        ),
      )

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
