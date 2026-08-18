import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import LimitCta from '~/components/atoms/LimitCta.vue'
import { ONE_SECOND, ONE_HOUR, ONE_DAY } from '~~/constants/time'

const { mockUseCookie } = vi.hoisted(() => ({
  mockUseCookie: vi.fn(),
}))

mockNuxtImport('useCookie', () => mockUseCookie)

describe('LimitCta', async () => {
  beforeEach(() => {
    mockUseCookie.mockReturnValue({ value: undefined })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    component.vm.show()
    await nextTick()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show component on mount if no cookie exists', async () => {
    const component = await mountSuspended(LimitCta)

    component.vm.show()
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeTruthy()
  })

  it('Should show component when the auto-check on mount finds an expired cookie', async () => {
    const now = Date.now()
    const dayAgo = now - ONE_DAY - ONE_SECOND
    mockUseCookie.mockReturnValue({ value: dayAgo })
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })

    const component = await mountSuspended(LimitCta)

    vi.advanceTimersByTime(50)
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeTruthy()
  })

  it('Should not show component when the auto-check on mount finds a fresh cookie', async () => {
    const now = Date.now()
    const recentTime = now - ONE_HOUR
    mockUseCookie.mockReturnValue({ value: recentTime })
    vi.spyOn(Date, 'now').mockReturnValue(now)
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })

    const component = await mountSuspended(LimitCta)

    vi.advanceTimersByTime(50)
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeFalsy()
  })

  it('Should show component when the auto-check on mount finds no cookie value', async () => {
    mockUseCookie.mockReturnValue({ value: undefined })
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })

    const component = await mountSuspended(LimitCta)

    vi.advanceTimersByTime(50)
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeTruthy()
  })

  it('Should hide component when close button is clicked', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    component.vm.show()
    await nextTick()

    expect(component.find('[test-id="cta"]')).toBeTruthy()

    await component.find('[test-id="close"]').trigger('click')
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeFalsy()
  })

  it('Should auto-close after 10 seconds', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    component.vm.show()
    await nextTick()

    expect(component.find('[test-id="cta"]')).toBeTruthy()

    vi.advanceTimersByTime(10000)
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeFalsy()
  })

  it('Should reset auto-close timer when show is called again', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    vi.spyOn(global, 'clearTimeout')
    component.vm.show()
    await nextTick()

    vi.advanceTimersByTime(5000)

    component.vm.show()
    await component.vm.$nextTick()

    expect(clearTimeout).toHaveBeenCalled()

    vi.advanceTimersByTime(5000)
    await nextTick()

    expect(component.find('[test-id="cta"]')).toBeTruthy()

    vi.advanceTimersByTime(5000)
    await nextTick()

    expect(component.find('[test-id="cta"]').exists()).toBeFalsy()
  })
})
