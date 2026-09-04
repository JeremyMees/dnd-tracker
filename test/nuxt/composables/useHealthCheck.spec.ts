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
mockNuxtImport('onNuxtReady', () => (callback: () => void) => callback())

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
    fetchMock.mockResolvedValue({ status: 'ok' })
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    vi.useRealTimers()
  })

  it('checks Open5e as soon as the app is ready', async () => {
    await mountProbe()

    expect(fetchMock).toHaveBeenCalledWith('https://api.open5e.com/v2')
    expect(toast).not.toHaveBeenCalled()
  })

  it('warns when Open5e cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))

    await mountProbe()

    expect(toast).toHaveBeenCalledWith({
      title: 'components.healthCheck.open5e.title',
      description: 'components.healthCheck.open5e.text',
      variant: 'warning',
    })
  })

  it('warns when Open5e responds with a falsy payload', async () => {
    fetchMock.mockResolvedValue(null)

    await mountProbe()

    expect(toast).toHaveBeenCalledWith({
      title: 'components.healthCheck.open5e.title',
      description: 'components.healthCheck.open5e.text',
      variant: 'warning',
    })
  })

  it('re-checks Open5e on the polling interval', async () => {
    await mountProbe()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300000)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not toast about connectivity on initial mount', async () => {
    await mountProbe()

    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('healthCheck.online'),
      }),
    )
    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('healthCheck.offline'),
      }),
    )
  })

  it('toasts when the connection goes offline', async () => {
    await mountProbe()
    vi.clearAllMocks()

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
    vi.clearAllMocks()

    isOnline.value = true
    await flushPromises()

    expect(toast).toHaveBeenCalledWith({
      title: 'components.healthCheck.online.title',
      description: 'components.healthCheck.online.text',
      variant: 'success',
    })
  })
})
