import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  supabaseAuthUpdateUser,
} from '~~/test/nuxt/stubs/query'
import { useProfileRemove, useProfileUpdate } from '~/queries/profiles'

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }))

mockNuxtImport('useAuthentication', () => () => ({ logout }))

describe('profiles queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useProfileUpdate', () => {
    it('updates the profile row and merges the result into auth-user state', async () => {
      const from = mockSupabaseFrom({
        profiles: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useProfileUpdate(),
        user: useState<ProfileRow | null>('auth-user', () => null),
      }))

      await vm.mutateAsync({
        id: '1',
        data: { username: 'Renamed' },
      })

      expect(from.mock.results[0]!.value.update).toHaveBeenCalledWith({
        username: 'Renamed',
      })
      expect(vm.user).toMatchObject({ username: 'Renamed' })
    })

    it('skips the profile update and updates supabase auth when only a password is given', async () => {
      const from = mockSupabaseFrom({})

      const { vm } = await mountHook(() => useProfileUpdate())

      await vm.mutateAsync({ id: '1', data: { password: 'secret123' } })

      expect(from).not.toHaveBeenCalled()
      expect(supabaseAuthUpdateUser).toHaveBeenCalledWith({
        password: 'secret123',
      })
    })

    it('reports an error when the profile update fails', async () => {
      mockSupabaseFrom({
        profiles: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useProfileUpdate())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({ id: '1', data: { username: 'Renamed' }, onError }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
    })
  })

  describe('useProfileRemove', () => {
    it('deletes the profile, removes the user account, and logs out', async () => {
      const from = mockSupabaseFrom({
        profiles: mockChain({ data: null, error: null }),
      })

      fetchMock.mockResolvedValue({ error: null })

      const { vm } = await mountHook(() => useProfileRemove())

      await vm.mutateAsync({ id: '1' })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', '1')
      expect(fetchMock).toHaveBeenCalledWith('/api/user/remove', {
        method: 'POST',
        body: { id: '1' },
      })
      expect(logout).toHaveBeenCalled()
    })

    it('does not log out when the profile deletion fails', async () => {
      mockSupabaseFrom({
        profiles: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useProfileRemove())
      const onError = vi.fn()

      await expect(vm.mutateAsync({ id: '1', onError })).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
      expect(logout).not.toHaveBeenCalled()
    })
  })
})
