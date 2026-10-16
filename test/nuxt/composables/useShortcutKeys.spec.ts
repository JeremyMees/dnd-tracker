import { afterEach, describe, expect, it, vi } from 'vitest'
import { useShortcutKeys } from '~/composables/useShortcutKeys'
import { mountHook } from '~~/test/nuxt/stubs/query-client'

describe('useShortcutKeys', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Should keep keys that are not the modifier', async () => {
    const { component, vm } = await mountHook(() => useShortcutKeys())

    expect(vm.keyLabel('K')).toBe('K')
    expect(vm.keyLabel('→')).toBe('→')

    component.unmount()
  })

  it('Should label the modifier as command on a mac', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh)' })

    const { component, vm } = await mountHook(() => useShortcutKeys())

    expect(vm.keyLabel('MOD')).toBe('⌘')
    expect(vm.keyLabel('SHIFT')).toBe('Shift')
    expect(vm.keyLabel('ENTER')).toBe('⏎')

    component.unmount()
  })

  it('Should label the modifier as control elsewhere', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' })

    const { component, vm } = await mountHook(() => useShortcutKeys())

    expect(vm.keyLabel('MOD')).toBe('Ctrl')
    expect(vm.keyLabel('SHIFT')).toBe('Shift')
    expect(vm.keyLabel('ENTER')).toBe('Enter')

    component.unmount()
  })
})
