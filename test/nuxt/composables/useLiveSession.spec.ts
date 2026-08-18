import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  start: (options?: { createIfMissing?: boolean }) => Promise<void>
  stop: () => Promise<void>
  sync: (payload: Record<string, unknown>) => void
}

const Probe = defineComponent({
  setup() {
    return useLiveSession(1)
  },
  template: '<div />',
})

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  mounted = component

  return { component, vm: component.vm as unknown as Probe }
}

describe('useLiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
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
      body: { encounter: 1, createIfMissing: true },
    })
    expect(vm.session).toEqual(response)
    expect(vm.active).toBe(true)
    expect(vm.loading).toBe(false)
  })

  it('Should check without creating when createIfMissing is false', async () => {
    fetchMock.mockResolvedValue(null)

    const { vm } = await mountProbe()

    await vm.start({ createIfMissing: false })

    expect(fetchMock).toHaveBeenCalledWith('/api/live/start', {
      method: 'POST',
      body: { encounter: 1, createIfMissing: false },
    })
    expect(vm.session).toBeUndefined()
    expect(vm.active).toBe(false)
    expect(toast).not.toHaveBeenCalled()
  })

  it('Should still populate session state when a check finds an existing session', async () => {
    const response = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    }

    fetchMock.mockResolvedValue(response)

    const { vm } = await mountProbe()

    await vm.start({ createIfMissing: false })

    expect(vm.session).toEqual(response)
    expect(vm.active).toBe(true)
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
      description: 'pages.encounter.liveSession.errors.proRequired',
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

  it('Should share session state across multiple consumers for the same encounter', async () => {
    const response = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    }

    fetchMock.mockResolvedValue(response)

    const first = await mountProbe()
    const second = await mountProbe()

    await first.vm.start()

    expect(second.vm.session).toEqual(response)

    first.component.unmount()
  })

  it('Should not sync when there is no active session', async () => {
    const { vm } = await mountProbe()

    vm.sync({ round: 2 })
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should not sync when the payload has no live-relevant fields', async () => {
    fetchMock.mockResolvedValueOnce({
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    })

    const { vm } = await mountProbe()

    await vm.start()
    fetchMock.mockClear()

    vm.sync({ title: 'Renamed' })
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should sync a live-relevant change while a session is active', async () => {
    fetchMock.mockResolvedValueOnce({
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    })

    const { vm } = await mountProbe()

    await vm.start()
    fetchMock.mockClear()
    fetchMock.mockResolvedValueOnce({ synced: true })

    vm.sync({ round: 3 })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/live/sync', {
      method: 'POST',
      body: { encounter: 1 },
    })
  })

  it('Should not throw when the sync request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    })

    const { vm } = await mountProbe()

    await vm.start()
    fetchMock.mockClear()
    fetchMock.mockRejectedValueOnce(new Error('Boom'))

    expect(() => vm.sync({ round: 3 })).not.toThrow()
    await flushPromises()
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
      description: 'pages.encounter.liveSession.errors.noActiveSession',
      variant: 'destructive',
    })
    expect(vm.loading).toBe(false)
  })
})
