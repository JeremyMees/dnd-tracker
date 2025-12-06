import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import LimitCta from '~/components/atoms/LimitCta.vue'

const stubs = {
  AnimationExpand: {
    template: '<div><slot></slot></div>',
  },
}

const cookieValue = ref<number | undefined>(undefined)

mockNuxtImport('useCookie', () => {
  return () => cookieValue
})

describe('LimitCta', async () => {
  afterEach(() => {
    cookieValue.value = undefined
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    component.vm.show()
    await nextTick()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show component on mount if no cookie exists', async () => {
    vi.useFakeTimers()
    cookieValue.value = undefined
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    await vi.advanceTimersByTimeAsync(50)

    expect(component.find('[data-test-cta]').exists()).toBe(true)
  })

  it('Should show component if cookie is expired', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    const dayAgo = now - 24 * 60 * 60 * 1000 - 1000
    cookieValue.value = dayAgo

    const component = await mountSuspended(LimitCta, { global: { stubs } })

    await vi.advanceTimersByTimeAsync(50)

    expect(component.find('[data-test-cta]').exists()).toBe(true)
  })

  it('Should not show component if cookie is not expired', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    const recentTime = now - 1000 * 60 * 60
    cookieValue.value = recentTime

    const component = await mountSuspended(LimitCta, { global: { stubs } })

    await vi.advanceTimersByTimeAsync(50)

    expect(component.find('[data-test-cta]').exists()).toBe(false)
  })

  it('Should hide component when close button is clicked', async () => {
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    component.vm.show()
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeTruthy()

    await component.find('[data-test-close]').trigger('click')
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })

  it('Should auto-close after 10 seconds', async () => {
    vi.useFakeTimers()
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    component.vm.show()
    await nextTick()

    expect(component.find('[data-test-cta]').exists()).toBeTruthy()

    await vi.advanceTimersByTimeAsync(10000)

    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })

  it('Should reset auto-close timer when show is called again', async () => {
    vi.useFakeTimers()
    const component = await mountSuspended(LimitCta, { global: { stubs } })

    component.vm.show()
    await nextTick()

    await vi.advanceTimersByTimeAsync(5000)

    component.vm.show()
    await nextTick()

    // After 5 more seconds (10 total from first show, 5 from second), should still be visible
    await vi.advanceTimersByTimeAsync(5000)
    expect(component.find('[data-test-cta]').exists()).toBeTruthy()

    // After another 5 seconds (10 from second show), should be hidden
    await vi.advanceTimersByTimeAsync(5000)
    expect(component.find('[data-test-cta]').exists()).toBeFalsy()
  })
})
