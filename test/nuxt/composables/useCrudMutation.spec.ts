import { resetToast, toast } from '~~/test/nuxt/stubs/toast'
import { useQueryClient } from '@tanstack/vue-query'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mountHook,
  mutationSpies,
} from '~~/test/nuxt/stubs/query'
import { useCrudMutation } from '~/composables/useCrudMutation'

type Variables = { id: number } & QueryDefaults

let component: VueWrapper | undefined

async function setup(
  options: Partial<CrudMutationOptions<Variables, void>> = {},
) {
  const mounted = await mountHook(() => ({
    queryClient: useQueryClient(),
    mutation: useCrudMutation<Variables>({
      type: 'general.note',
      action: 'create',
      mutationFn: async () => {},
      invalidate: ({ id }) => [['useNoteListing'], ['useNoteDetail', id]],
      ...options,
    }),
  }))

  component = mounted.component

  return mounted.vm
}

describe('useCrudMutation', () => {
  beforeEach(async () => {
    await clearQueryCache()
    resetToast()
  })

  afterEach(() => {
    component?.unmount()
    component = undefined
  })

  it('invalidates the keys built from the variables on success', async () => {
    const vm = await setup()
    const invalidate = vi.spyOn(vm.queryClient, 'invalidateQueries')

    await vm.mutation.mutateAsync({ id: 3 })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['useNoteListing'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['useNoteDetail', 3] })
  })

  it('removes the keys built from the variables on success', async () => {
    const vm = await setup({ remove: ({ id }) => [['useNoteMember', id]] })
    const remove = vi.spyOn(vm.queryClient, 'removeQueries')

    await vm.mutation.mutateAsync({ id: 3 })

    expect(remove).toHaveBeenCalledWith({ queryKey: ['useNoteMember', 3] })
  })

  it('shows the success message as the description for non-delete actions', async () => {
    const vm = await setup({ action: 'update' })

    await vm.mutation.mutateAsync({ id: 3 })

    expect(toast.success).toHaveBeenCalledWith(
      'components.toast.update.success',
    )
  })

  it('shows the success message as the title for a delete', async () => {
    const vm = await setup({ action: 'delete' })

    await vm.mutation.mutateAsync({ id: 3 })

    expect(toast.success).toHaveBeenCalledWith(
      'components.toast.delete.success',
    )
  })

  it('hands the caller its callbacks on success', async () => {
    const vm = await setup()
    const spies = mutationSpies()

    await vm.mutation.mutateAsync({ id: 3, ...spies })

    expect(spies.onSuccess).toHaveBeenCalledOnce()
    expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    expect(spies.onError).not.toHaveBeenCalled()
  })

  it('reports the error and toasts the failure reason', async () => {
    const vm = await setup({
      action: 'copy',
      mutationFn: async () => {
        throw new Error('boom')
      },
    })
    const spies = mutationSpies()

    await expect(vm.mutation.mutateAsync({ id: 3, ...spies })).rejects.toThrow(
      'boom',
    )

    expect(spies.onError).toHaveBeenCalledWith('boom')
    expect(spies.onSettled).toHaveBeenCalledWith('boom')
    expect(spies.onSuccess).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('components.toast.copy.error', {
      description: 'general.error.reasons.rejected',
    })
  })
})
