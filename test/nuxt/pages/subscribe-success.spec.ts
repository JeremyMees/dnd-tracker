import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import confetti from 'canvas-confetti'
import SubscribeSuccess from '~/pages/subscribe-success.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const confettiMock = vi.mocked(confetti)

const stubs = { NuxtLayout: nuxtLayoutStub }

function mountPage() {
  return mountSuspended(SubscribeSuccess, { global: { stubs } })
}

describe('Subscribe success page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should render the title and description', async () => {
    const component = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(
      'pages.subscribeSuccess.title',
    )
    expect(component.get('[test-id="description"]').text()).toBe(
      'pages.subscribeSuccess.description',
    )
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Successfully subscribed')
  })

  it('Should not fire confetti before the first interval tick', async () => {
    await mountPage()

    expect(confettiMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(249)

    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('Should fire two confetti bursts every 250ms', async () => {
    await mountPage()

    vi.advanceTimersByTime(250)

    expect(confettiMock).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(250)

    expect(confettiMock).toHaveBeenCalledTimes(4)
  })

  it('Should stop firing confetti after the 5 second duration', async () => {
    await mountPage()

    vi.advanceTimersByTime(5000)

    expect(confettiMock).toHaveBeenCalledTimes(38)

    vi.advanceTimersByTime(5000)

    expect(confettiMock).toHaveBeenCalledTimes(38)
  })

  it('Should decrease the particle count as the animation progresses', async () => {
    await mountPage()

    vi.advanceTimersByTime(250)

    const first = confettiMock.mock.calls[0]?.[0]?.particleCount

    vi.advanceTimersByTime(4000)

    const last = confettiMock.mock.calls.at(-1)?.[0]?.particleCount

    expect(first).toBeCloseTo(47.5)
    expect(last).toBeLessThan(first!)
    expect(last).toBeGreaterThan(0)
  })

  it('Should fire bursts from opposite sides of the screen', async () => {
    await mountPage()

    vi.advanceTimersByTime(5000)

    confettiMock.mock.calls.forEach(([options], index) => {
      const { x, y } = options?.origin ?? {}

      expect(y).toBeGreaterThanOrEqual(-0.2)
      expect(y).toBeLessThanOrEqual(0.8)

      if (index % 2 === 0) {
        expect(x).toBeGreaterThanOrEqual(0.1)
        expect(x).toBeLessThanOrEqual(0.3)
      } else {
        expect(x).toBeGreaterThanOrEqual(0.7)
        expect(x).toBeLessThanOrEqual(0.9)
      }
    })
  })

  it('Should use the shared confetti defaults for every burst', async () => {
    await mountPage()

    vi.advanceTimersByTime(500)

    confettiMock.mock.calls.forEach(([options]) => {
      expect(options).toMatchObject({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
      })
    })
  })
})
