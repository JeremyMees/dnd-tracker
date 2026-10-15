import { expect, vi } from 'vitest'

const { toast } = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

vi.mock('vue-sonner', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast,
}))

const toastFunctions = [
  toast,
  toast.success,
  toast.error,
  toast.info,
  toast.warning,
]

export function resetToast(): void {
  toastFunctions.forEach(fn => fn.mockReset())
}

export function expectNoToast(): void {
  toastFunctions.forEach(fn => expect(fn).not.toHaveBeenCalled())
}

export { toast }
