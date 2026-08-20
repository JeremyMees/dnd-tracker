const REVEAL_CLASS = 'theme-reveal'
const REVEAL_SCALE = 2.5

function revealOrigin(anchor?: HTMLElement | null): { x: number; y: number } {
  const rect = anchor?.getBoundingClientRect()

  if (!rect || (!rect.width && !rect.height)) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function revealSize({ x, y }: { x: number; y: number }): number {
  const { innerWidth: width, innerHeight: height } = window

  return (
    Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y),
    ) * REVEAL_SCALE
  )
}

export function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
}

export async function revealTransition(
  update: () => void,
  anchor?: HTMLElement | null,
): Promise<void> {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }

  const root = document.documentElement
  const origin = revealOrigin(anchor)

  root.style.setProperty('--reveal-x', `${origin.x}px`)
  root.style.setProperty('--reveal-y', `${origin.y}px`)
  root.style.setProperty('--reveal-size', `${revealSize(origin)}px`)
  root.classList.add(REVEAL_CLASS)

  const transition = document.startViewTransition(async () => {
    update()
    await nextTick()
  })

  await transition.finished.catch(() => undefined)

  root.classList.remove(REVEAL_CLASS)
  root.style.removeProperty('--reveal-x')
  root.style.removeProperty('--reveal-y')
  root.style.removeProperty('--reveal-size')
}
