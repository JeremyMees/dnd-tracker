import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRowShortcut } from '~/composables/useRowShortcut'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountHook } from '~~/test/nuxt/stubs/query-client'

describe('useRowShortcut', () => {
  afterEach(() => {
    useRowShortcut().request.value = undefined
    useRowShortcut().targetId.value = undefined
  })

  it('Should hand a request to the matching row and clear it', async () => {
    const handler = vi.fn()
    const { component } = await mountHook(() => {
      useRowShortcut().onRequest('row-1', ['damage', 'heal'], handler)

      return {}
    })

    const { request, trigger } = useRowShortcut()

    trigger('row-1', 'heal')
    await nextTick()

    expect(handler).toHaveBeenCalledWith('heal')
    expect(request.value).toBeUndefined()

    component.unmount()
  })

  it('Should leave requests for other rows and actions alone', async () => {
    const handler = vi.fn()
    const { component } = await mountHook(() => {
      useRowShortcut().onRequest('row-1', ['condition'], handler)

      return {}
    })

    const { request, trigger } = useRowShortcut()

    trigger('row-2', 'condition')
    await nextTick()
    trigger('row-1', 'damage')
    await nextTick()

    expect(handler).not.toHaveBeenCalled()
    expect(request.value).toEqual({ rowId: 'row-1', action: 'damage' })

    component.unmount()
  })

  describe('target', () => {
    const first = sheet.rows[0]!.id
    const second = sheet.rows[1]!.id
    const last = sheet.rows.at(-1)!.id

    it('Should fall back to the current creature', () => {
      const { targetRowId, isTarget } = useRowShortcut()

      expect(targetRowId(sheet)).toBe(first)
      expect(isTarget(sheet, first)).toBe(true)
      expect(isTarget(sheet, second)).toBe(false)
      expect(targetRowId(undefined)).toBeUndefined()
    })

    it('Should fall back when the target left the encounter', () => {
      const { targetId, targetRowId } = useRowShortcut()

      targetId.value = 'gone'

      expect(targetRowId(sheet)).toBe(first)
    })

    it('Should move the target and wrap around', () => {
      const { targetRowId, moveTarget } = useRowShortcut()

      moveTarget(sheet, 1)
      expect(targetRowId(sheet)).toBe(second)

      moveTarget(sheet, -1)
      moveTarget(sheet, -1)
      expect(targetRowId(sheet)).toBe(last)

      moveTarget(sheet, 1)
      expect(targetRowId(sheet)).toBe(first)
    })

    it('Should not move without rows', () => {
      const { targetId, moveTarget } = useRowShortcut()

      moveTarget({ ...sheet, rows: [] }, 1)
      moveTarget(undefined, 1)

      expect(targetId.value).toBeUndefined()
    })
  })
})
