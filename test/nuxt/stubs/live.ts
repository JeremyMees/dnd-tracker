import { vi } from 'vitest'

export const liveSeat: LiveJoinResponse = {
  sessionToken: 'session-token',
  seatToken: 'seat-token',
  seat: 'seat-1',
  row: 'row-1',
  spectator: false,
  code: 'ABC234',
  expiresAt: 'later',
  uuid: 'session-uuid',
}

export function setSeat(overrides: Partial<LiveJoinResponse> = {}): void {
  localStorage.setItem(
    'live-seat',
    JSON.stringify({ ...liveSeat, ...overrides }),
  )
}

export function setViewport(size: 'desktop' | 'mobile'): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: size === 'desktop',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

export function stubRowElement(
  wrapper: { element: Element },
  rect: { top: number; bottom: number },
): ReturnType<typeof vi.fn> {
  const element = wrapper.element as HTMLElement
  const scrollIntoView = vi.fn()

  element.getBoundingClientRect = () => rect as DOMRect
  element.scrollIntoView = scrollIntoView

  return scrollIntoView
}
