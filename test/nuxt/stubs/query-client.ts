import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useQueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import type { ShallowUnwrapRef } from 'vue'

export async function mountHook<T extends Record<string, unknown>>(
  setupFn: () => T | Promise<T>,
) {
  const component = await mountSuspended(
    defineComponent({ setup: setupFn, template: '<div />' }),
  )

  await flushPromises()

  return {
    component,
    vm: component.vm as unknown as ShallowUnwrapRef<T>,
  }
}

export async function clearQueryCache() {
  const { vm } = await mountHook(() => ({ queryClient: useQueryClient() }))

  vm.queryClient.clear()
}
