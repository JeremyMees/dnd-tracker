import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
  supabaseAuthUpdateUser,
} from '~~/test/nuxt/stubs/query'
import { useProfileRemove, useProfileUpdate } from '~/queries/profiles'

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }))

mockNuxtImport('useAuthentication', () => () => ({ logout }))

describe('profiles queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    logout.mockClear()
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
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({ id: '1', data: { username: 'Renamed' }, ...spies }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(spies.onSuccess).not.toHaveBeenCalled()
    })

    it('reports an error when the supabase auth update fails', async () => {
      mockSupabaseFrom({ profiles: mockChain({ data: null, error: null }) })
      supabaseAuthUpdateUser.mockResolvedValueOnce({
        error: { message: 'email taken' },
      })

      const { vm } = await mountHook(() => useProfileUpdate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          id: '1',
          data: { email: 'new@example.com' },
          ...spies,
        }),
      ).rejects.toThrow('email taken')

      expect(spies.onError).toHaveBeenCalledWith('email taken')
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ profiles: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useProfileUpdate())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: '1', data: { username: 'Renamed' }, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
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

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ profiles: mockChain({ data: null, error: null }) })
      fetchMock.mockResolvedValue({ error: null })

      const { vm } = await mountHook(() => useProfileRemove())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: '1', ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('does not log out when the account removal route reports an error', async () => {
      mockSupabaseFrom({ profiles: mockChain({ data: null, error: null }) })
      fetchMock.mockResolvedValue({ error: { message: 'still linked' } })

      const { vm } = await mountHook(() => useProfileRemove())
      const spies = mutationSpies()

      await expect(vm.mutateAsync({ id: '1', ...spies })).rejects.toThrow(
        'still linked',
      )

      expect(spies.onError).toHaveBeenCalledWith('still linked')
      expect(logout).not.toHaveBeenCalled()
    })

    it('does not log out when the profile deletion fails', async () => {
      mockSupabaseFrom({
        profiles: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useProfileRemove())
      const spies = mutationSpies()

      await expect(vm.mutateAsync({ id: '1', ...spies })).rejects.toThrow(
        'boom',
      )

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(logout).not.toHaveBeenCalled()
    })
  })
})
