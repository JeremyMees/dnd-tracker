import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useOnline, useInterval } from '@vueuse/core'
import { useToast } from '~/components/ui/toast'
import { useHealthCheck } from '~/composables/useHealthCheck'

vi.mock('@vueuse/core', () => ({
  useOnline: vi.fn(),
  useInterval: vi.fn(),
}))

vi.mock('~/components/ui/toast', () => ({
  useToast: vi.fn(),
}))

describe('useHealthCheck', () => {
  let healthCheck: ReturnType<typeof useHealthCheck>
  let mockToast: any
  let mockUseInterval: any
  let intervalCallback: any
  let isOnlineRef: any
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({ toast: mockToast })

    isOnlineRef = ref(true)
    vi.mocked(useOnline).mockReturnValue(isOnlineRef)

    mockUseInterval = vi.fn((delay, options) => {
      intervalCallback = options.callback
    })
    vi.mocked(useInterval).mockImplementation(mockUseInterval)

    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)

    healthCheck = useHealthCheck()
  })

  it('should initialize with online status', () => {
    expect(vi.mocked(useOnline)).toHaveBeenCalled()
    expect(vi.mocked(useToast)).toHaveBeenCalled()
  })

  it('should set up interval for Open5e check', () => {
    expect(vi.mocked(useInterval)).toHaveBeenCalledWith(300000, { callback: expect.any(Function) })
  })

  it('should toast when going online', async () => {
    isOnlineRef.value = false
    await nextTick()
    mockToast.mockClear()
    isOnlineRef.value = true
    await nextTick()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'components.healthCheck.online.title',
      description: 'components.healthCheck.online.text',
      variant: 'success',
    })
  })

  it('should toast when going offline', async () => {
    isOnlineRef.value = true
    await nextTick()
    mockToast.mockClear()
    isOnlineRef.value = false
    await nextTick()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'components.healthCheck.offline.title',
      description: 'components.healthCheck.offline.text',
      variant: 'destructive',
    })
  })

  it('should check Open5e successfully', async () => {
    mockFetch.mockResolvedValue({})
    await intervalCallback()

    expect(mockFetch).toHaveBeenCalledWith('https://api.open5e.com/')
  })

  it('should handle Open5e failure', async () => {
    mockFetch.mockRejectedValue(new Error('Failed'))
    await intervalCallback()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'components.healthCheck.open5e.title',
      description: 'components.healthCheck.open5e.text',
      variant: 'warning',
    })
  })
})
