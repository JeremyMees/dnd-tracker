import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHealthCheck } from '~/composables/useHealthCheck'

const { fetchMock, toast } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)

const isOnline = ref(true)

mockNuxtImport('useOnline', () => () => isOnline)

const Probe = defineComponent({
  setup() {
    useHealthCheck()

    return {}
  },
  template: '<div />',
})

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  mounted = component

  return component
}

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    isOnline.value = true
    fetchMock.mockReset()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    vi.useRealTimers()
  })

  it('never reaches out to open5e itself', async () => {
    await mountProbe()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('starts no polling interval', async () => {
    await mountProbe()

    await vi.advanceTimersByTimeAsync(600000)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it('does not toast about connectivity on initial mount', async () => {
    await mountProbe()

    expect(toast).not.toHaveBeenCalled()
  })

  it('toasts when the connection goes offline', async () => {
    await mountProbe()

    isOnline.value = false
    await flushPromises()

    expect(toast).toHaveBeenCalledWith({
      title: 'components.healthCheck.offline.title',
      description: 'components.healthCheck.offline.text',
      variant: 'destructive',
    })
  })

  it('toasts when the connection comes back online', async () => {
    isOnline.value = false

    await mountProbe()

    isOnline.value = true
    await flushPromises()

    expect(toast).toHaveBeenCalledWith({
      title: 'components.healthCheck.online.title',
      description: 'components.healthCheck.online.text',
      variant: 'success',
    })
  })
})
