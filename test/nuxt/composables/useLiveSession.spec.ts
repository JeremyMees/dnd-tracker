import { expectNoToast, toast } from '~~/test/nuxt/stubs/toast'
import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveSession } from '~/composables/useLiveSession'

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}))

mockNuxtImport('$fetch', () => fetchMock)

interface Probe {
  session?: { token: string; code: string; expiresAt: string }
  active: boolean
  loading: boolean
  start: (options?: { createIfMissing?: boolean }) => Promise<void>
  stop: () => Promise<void>
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

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/start', {
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

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/start', {
      method: 'POST',
      body: { encounter: 1, createIfMissing: false },
    })
    expect(vm.session).toBeUndefined()
    expect(vm.active).toBe(false)
    expectNoToast()
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
      Object.assign(
        new Error('[POST] "/api/encounter/live/start": 403 Forbidden'),
        {
          data: { statusCode: 403, statusMessage: 'pro-required' },
        },
      ),
    )

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast.error).toHaveBeenCalledWith(
      'components.liveSession.failed.start',
      { description: 'pages.encounter.liveSession.errors.proRequired' },
    )
    expect(vm.session).toBeUndefined()
    expect(vm.loading).toBe(false)
  })

  it('Should fall back to a generic error when the failure carries no message', async () => {
    fetchMock.mockRejectedValue(new Error(''))

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast.error).toHaveBeenCalledWith(
      'components.liveSession.failed.start',
      { description: 'general.error.reasons.rejected' },
    )
  })

  it('Should fall back to a generic error for an unrecognized slug', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(
        new Error(
          '[POST] "/api/encounter/live/start": 500 Internal Server Error',
        ),
        {
          data: { statusCode: 500, statusMessage: 'something-unexpected' },
        },
      ),
    )

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast.error).toHaveBeenCalledWith(
      'components.liveSession.failed.start',
      { description: 'general.error.reasons.rejected' },
    )
  })

  it('Should explain an unrecognized failure from its status code', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(
        new Error('[POST] "/api/encounter/live/start": 429 Too Many Requests'),
        {
          statusCode: 429,
          data: { statusCode: 429, statusMessage: 'Too Many Requests' },
        },
      ),
    )

    const { vm } = await mountProbe()

    await vm.start()

    expect(toast.error).toHaveBeenCalledWith(
      'components.liveSession.failed.start',
      { description: 'general.error.reasons.rateLimited' },
    )
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

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/live/stop', {
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

  it('Should toast the translated error when stopping fails with a known slug', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(
        new Error('[POST] "/api/encounter/live/stop": 404 Not Found'),
        {
          data: { statusCode: 404, statusMessage: 'no-active-session' },
        },
      ),
    )

    const { vm } = await mountProbe()

    await vm.stop()

    expect(toast.error).toHaveBeenCalledWith(
      'components.liveSession.failed.end',
      { description: 'pages.encounter.liveSession.errors.noActiveSession' },
    )
    expect(vm.loading).toBe(false)
  })
})
