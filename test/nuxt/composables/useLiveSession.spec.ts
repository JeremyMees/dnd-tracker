import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveSession } from '~/composables/useLiveSession'

const { fetchMock, toast } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)

interface Probe {
  session?: { token: string; code: string; expiresAt: string }
  active: boolean
  loading: boolean
  start: () => Promise<void>
  stop: () => Promise<void>
}

const Probe = defineComponent({
  setup() {
    return useLiveSession(1)
  },
  template: '<div />',
})

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  return { component, vm: component.vm as unknown as Probe }
}

describe('useLiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  it('Should have no active session by default', async () => {
    const { vm } = await mountProbe()

    expect(vm.session).toBeUndefined()
    expect(vm.active).toBe(false)
  })

  it('Should start a live session', async () => {
    const response = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    }

    fetchMock.mockResolvedValue(response)

    const { vm } = await mountProbe()

    await vm.start()

    expect(fetchMock).toHaveBeenCalledWith('/api/live/start', {
      method: 'POST',
      body: { encounter: 1 },
    })
    expect(vm.session).toEqual(response)
    expect(vm.active).toBe(true)
    expect(vm.loading).toBe(false)
  })

  it('Should consider an expired session inactive', async () => {
    fetchMock.mockResolvedValue({
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() - 10_000).toISOString(),
    })

    const { vm } = await mountProbe()

    await vm.start()

    expect(vm.active).toBe(false)
  })

  it('Should toast the translated error when starting fails with a known slug', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('[POST] "/api/live/start": 403 Forbidden'), {
        data: { statusCode: 403, statusMessage: 'pro-required' },
      }),
    )

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'components.liveSession.errors.proRequired',
      variant: 'destructive',
    })
    expect(vm.session).toBeUndefined()
    expect(vm.loading).toBe(false)
  })

  it('Should fall back to a generic error when the failure carries no message', async () => {
    fetchMock.mockRejectedValue(new Error(''))

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should fall back to a generic error for an unrecognized slug', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(
        new Error('[POST] "/api/live/start": 500 Internal Server Error'),
        {
          data: { statusCode: 500, statusMessage: 'something-unexpected' },
        },
      ),
    )

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should stop a live session', async () => {
    fetchMock.mockResolvedValueOnce({
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    })

    const { vm } = await mountProbe()

    await vm.start()

    fetchMock.mockResolvedValueOnce({ success: true })

    await vm.stop()

    expect(fetchMock).toHaveBeenCalledWith('/api/live/stop', {
      method: 'POST',
      body: { encounter: 1 },
    })
    expect(vm.session).toBeUndefined()
    expect(vm.active).toBe(false)
  })

  it('Should toast the translated error when stopping fails with a known slug', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('[POST] "/api/live/stop": 404 Not Found'), {
        data: { statusCode: 404, statusMessage: 'no-active-session' },
      }),
    )

    const { vm } = await mountProbe()

    await vm.stop()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'components.liveSession.errors.noActiveSession',
      variant: 'destructive',
    })
    expect(vm.loading).toBe(false)
  })
})
