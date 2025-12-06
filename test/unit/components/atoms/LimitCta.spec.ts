import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import LimitCta from '~/components/atoms/LimitCta.vue'

const stubs = {
  AnimationExpand: {
    template: '<div><slot></slot></div>',
  },
}

describe('LimitCta', async () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    vi.useFakeTimers()
    component.vm.show()
    await nextTick()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show component on mount if no cookie exists', async () => {
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    component.vm.show()
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeTruthy()
  })

  it('Should show component if cookie is expired', async () => {
    const now = Date.now()
    const dayAgo = now - 24 * 60 * 60 * 1000 - 1000
    const mockUseCookie = vi.fn().mockReturnValue({ value: dayAgo })

    vi.stubGlobal('useCookie', mockUseCookie)
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const component = await mountSuspended(LimitCta, { global: { stubs } })

    vi.useFakeTimers()
    vi.advanceTimersByTime(100)
    await nextTick()

    expect(component.find('[data-test-cta]')).toBeTruthy()
  })

  it('Should not show component if cookie is not expired', async () => {
    const now = Date.now()
    const recentTime = now - 1000 * 60 * 60
    const mockUseCookie = vi.fn().mockReturnValue({ value: recentTime })

    vi.stubGlobal('useCookie', mockUseCookie)
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers()
    vi.advanceTimersByTime(100)
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })

  it('Should hide component when close button is clicked', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers()
    component.vm.show()
    await nextTick()

    expect(component.find('[data-test-cta]')).toBeTruthy()

    await component.find('[data-test-close]').trigger('click')
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })

  it('Should auto-close after 10 seconds', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers()
    component.vm.show()
    await nextTick()

    expect(component.find('[data-test-cta]')).toBeTruthy()

    vi.advanceTimersByTime(10000)
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })

  it('Should reset auto-close timer when show is called again', async () => {
    const component = await mountSuspended(LimitCta)

    vi.useFakeTimers()
    vi.spyOn(global, 'clearTimeout')
    component.vm.show()
    await nextTick()

    vi.advanceTimersByTime(5000)

    component.vm.show()
    await component.vm.$nextTick()

    expect(clearTimeout).toHaveBeenCalled()

    vi.advanceTimersByTime(5000)
    await nextTick()

    expect(component.find('[data-test-cta]')).toBeTruthy()

    vi.advanceTimersByTime(5000)
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })
})
