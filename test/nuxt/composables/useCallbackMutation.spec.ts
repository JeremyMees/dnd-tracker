import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mountHook,
  mutationSpies,
} from '~~/test/nuxt/stubs/query'
import { useCallbackMutation } from '~/composables/useCallbackMutation'

type Variables = { id: number } & QueryDefaults

let component: VueWrapper | undefined

async function setup(
  options: Parameters<typeof useCallbackMutation<number, Variables, string>>[0],
) {
  const mounted = await mountHook(() => ({
    mutation: useCallbackMutation(options),
  }))

  component = mounted.component

  return mounted.vm
}

describe('useCallbackMutation', () => {
  beforeEach(async () => {
    await clearQueryCache()
  })

  afterEach(() => {
    component?.unmount()
    component = undefined
  })

  it('runs its own success handler before the caller callbacks', async () => {
    const calls: string[] = []
    const vm = await setup({
      mutationFn: async ({ id }) => id * 2,
      onMutate: () => 'snapshot',
      onSuccess: (data, variables, onMutateResult) => {
        calls.push(`own:${data}:${variables.id}:${onMutateResult}`)
      },
    })

    await vm.mutation.mutateAsync({
      id: 3,
      onSuccess: () => calls.push('caller:success'),
      onSettled: error => calls.push(`caller:settled:${error}`),
    })

    expect(calls).toEqual([
      'own:6:3:snapshot',
      'caller:success',
      'caller:settled:undefined',
    ])
  })

  it('runs its own error handler before handing the caller the message', async () => {
    const calls: string[] = []
    const vm = await setup({
      mutationFn: async () => {
        throw new Error('boom')
      },
      onMutate: () => 'snapshot',
      onError: (error, _variables, onMutateResult) => {
        calls.push(`own:${error.message}:${onMutateResult}`)
      },
    })

    await expect(
      vm.mutation.mutateAsync({
        id: 3,
        onError: error => calls.push(`caller:error:${error}`),
        onSettled: error => calls.push(`caller:settled:${error}`),
      }),
    ).rejects.toThrow('boom')

    expect(calls).toEqual([
      'own:boom:snapshot',
      'caller:error:boom',
      'caller:settled:boom',
    ])
  })

  it('runs its own settled handler', async () => {
    const onSettled = vi.fn()
    const vm = await setup({ mutationFn: async () => 1, onSettled })

    await vm.mutation.mutateAsync({ id: 3 })

    expect(onSettled).toHaveBeenCalledWith(
      1,
      null,
      { id: 3 },
      undefined,
      expect.anything(),
    )
  })

  it('works without any handlers of its own', async () => {
    const vm = await setup({ mutationFn: async () => 1 })
    const spies = mutationSpies()

    await vm.mutation.mutateAsync({ id: 3, ...spies })

    expect(spies.onSuccess).toHaveBeenCalledOnce()
    expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    expect(spies.onError).not.toHaveBeenCalled()
  })
})
