import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRowShortcut } from '~/composables/useRowShortcut'
import { mountHook } from '~~/test/nuxt/stubs/query-client'

describe('useRowShortcut', () => {
  afterEach(() => {
    useRowShortcut().request.value = undefined
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
})
