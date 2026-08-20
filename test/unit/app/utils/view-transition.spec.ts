// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion, revealTransition } from '~/utils/view-transition'

type ViewTransitionStub = {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  skipTransition: () => void
}

function stubViewTransition(finished: Promise<void> = Promise.resolve()) {
  const startViewTransition = vi.fn(
    (callback: () => unknown): ViewTransitionStub => {
      callback()

      return {
        finished,
        ready: finished,
        updateCallbackDone: finished,
        skipTransition: vi.fn(),
      }
    },
  )

  Object.defineProperty(document, 'startViewTransition', {
    value: startViewTransition,
    configurable: true,
    writable: true,
  })

  return startViewTransition
}

function stubReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn(() => ({ matches })),
    configurable: true,
    writable: true,
  })
}

function anchorElement(rect: Partial<DOMRect>): HTMLElement {
  const element = document.createElement('div')

  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 0, height: 0, ...rect }) as DOMRect

  return element
}

function revealProperties() {
  const { style } = document.documentElement

  return {
    x: style.getPropertyValue('--reveal-x'),
    y: style.getPropertyValue('--reveal-y'),
    size: style.getPropertyValue('--reveal-size'),
  }
}

describe('view-transition', () => {
  beforeEach(() => {
    stubReducedMotion(false)
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
  })

  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition')
    vi.restoreAllMocks()
  })

  describe('prefersReducedMotion', () => {
    it('Should report the reduced motion preference', () => {
      stubReducedMotion(true)
      expect(prefersReducedMotion()).toBe(true)

      stubReducedMotion(false)
      expect(prefersReducedMotion()).toBe(false)
    })

    it('Should default to false when matchMedia is unavailable', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        configurable: true,
        writable: true,
      })

      expect(prefersReducedMotion()).toBe(false)
    })
  })

  describe('revealTransition', () => {
    it('Should apply the update directly when view transitions are unsupported', async () => {
      const update = vi.fn()

      await revealTransition(update)

      expect(update).toHaveBeenCalledOnce()
      expect(document.documentElement.classList.contains('theme-reveal')).toBe(
        false,
      )
    })

    it('Should apply the update directly when reduced motion is preferred', async () => {
      const startViewTransition = stubViewTransition()
      stubReducedMotion(true)
      const update = vi.fn()

      await revealTransition(update)

      expect(update).toHaveBeenCalledOnce()
      expect(startViewTransition).not.toHaveBeenCalled()
    })

    it('Should run the update inside a view transition', async () => {
      const startViewTransition = stubViewTransition()
      const update = vi.fn()

      await revealTransition(update)

      expect(startViewTransition).toHaveBeenCalledOnce()
      expect(update).toHaveBeenCalledOnce()
    })

    it('Should center the reveal on the anchor and cover the farthest corner', async () => {
      stubViewTransition()
      const anchor = anchorElement({
        left: 100,
        top: 200,
        width: 40,
        height: 20,
      })
      let properties = revealProperties()

      await revealTransition(() => {
        properties = revealProperties()
      }, anchor)

      const size = Math.hypot(window.innerWidth - 120, window.innerHeight - 210)

      expect(properties.x).toBe('120px')
      expect(properties.y).toBe('210px')
      expect(properties.size).toBe(`${size * 2.5}px`)
    })

    it('Should fall back to the viewport center without an anchor', async () => {
      stubViewTransition()
      let properties = revealProperties()

      await revealTransition(() => {
        properties = revealProperties()
      })

      expect(properties.x).toBe(`${window.innerWidth / 2}px`)
      expect(properties.y).toBe(`${window.innerHeight / 2}px`)
    })

    it('Should fall back to the viewport center for a collapsed anchor', async () => {
      stubViewTransition()
      let properties = revealProperties()

      await revealTransition(
        () => {
          properties = revealProperties()
        },
        anchorElement({ left: 100, top: 200 }),
      )

      expect(properties.x).toBe(`${window.innerWidth / 2}px`)
      expect(properties.y).toBe(`${window.innerHeight / 2}px`)
    })

    it('Should scope the reveal styles to the transition', async () => {
      stubViewTransition()
      let scopedDuringUpdate = false

      await revealTransition(() => {
        scopedDuringUpdate =
          document.documentElement.classList.contains('theme-reveal')
      })

      expect(scopedDuringUpdate).toBe(true)
      expect(document.documentElement.classList.contains('theme-reveal')).toBe(
        false,
      )
      expect(revealProperties()).toEqual({ x: '', y: '', size: '' })
    })

    it('Should clean up when the transition fails', async () => {
      stubViewTransition(Promise.reject(new Error('skipped')))
      const update = vi.fn()

      await expect(revealTransition(update)).resolves.toBeUndefined()

      expect(update).toHaveBeenCalledOnce()
      expect(document.documentElement.classList.contains('theme-reveal')).toBe(
        false,
      )
      expect(revealProperties()).toEqual({ x: '', y: '', size: '' })
    })
  })
})
