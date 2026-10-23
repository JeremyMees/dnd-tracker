import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sheet } from '../../fixtures/initiative-sheet'
import { useInitiativeSheet } from '~/composables/useInitiativeSheet'
import { useRowShortcut } from '~/composables/useRowShortcut'

const { onKeyStrokeMock } = vi.hoisted(() => ({
  onKeyStrokeMock: vi.fn(),
}))

mockNuxtImport('onKeyStroke', () => onKeyStrokeMock)

const updateFn = vi.fn()

const mockSheet = shallowRef<InitiativeSheet>({ ...sheet })

const sheetComputed = {
  get value() {
    return mockSheet.value
  },
} as unknown as ComputedRef<InitiativeSheet | undefined>

const update = async (
  payload: Omit<Partial<InitiativeSheet>, NotUpdatable>,
) => {
  Object.assign(mockSheet.value, payload)

  updateFn(payload)
}

const nextTurnFn = vi.fn()

const nextTurn = async (): Promise<void> => {
  const { activeIndex, round, rows } = advanceTurn(mockSheet.value)

  Object.assign(mockSheet.value, { activeIndex, round, rows })

  nextTurnFn()
}

describe('useInitiativeSheet', async () => {
  beforeEach(() => (mockSheet.value = { ...sheet }))

  it('Should set the first row as selected and navigate properly', async () => {
    const { next, previous } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    expect(mockSheet.value.activeIndex).toBe(0)

    next()

    expect(mockSheet.value.activeIndex).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
  })

  it('Should advance through nextTurn instead of a direct update', async () => {
    const { next } = useInitiativeSheet(sheetComputed, update, nextTurn)

    updateFn.mockClear()
    nextTurnFn.mockClear()

    next()

    expect(nextTurnFn).toHaveBeenCalledTimes(1)
    expect(updateFn).not.toHaveBeenCalled()
  })

  it('Should go to first row when the last row is active and next is called', async () => {
    mockSheet.value.activeIndex = sheet.rows.length - 1
    const { next } = useInitiativeSheet(sheetComputed, update, nextTurn)

    expect(mockSheet.value.round).toBe(1)

    next()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(2)
  })

  it('Should swallow a failed turn advance', async () => {
    const { next } = useInitiativeSheet(sheetComputed, update, () =>
      Promise.reject(new Error('boom')),
    )

    expect(() => next()).not.toThrow()
    await flushPromises()
  })

  it('Should swallow a failed update when going back or resetting', async () => {
    mockSheet.value.round = 2

    const { previous, reset } = useInitiativeSheet(
      sheetComputed,
      () => Promise.reject(new Error('boom')),
      nextTurn,
    )

    expect(() => previous()).not.toThrow()
    expect(() => reset(true)).not.toThrow()
    await flushPromises()
  })

  it('Should go to last row when the first row is active the round is not 1 and previous is called', async () => {
    mockSheet.value.round = 2

    const { previous } = useInitiativeSheet(sheetComputed, update, nextTurn)

    expect(mockSheet.value.round).toBe(2)

    previous()

    expect(mockSheet.value.activeIndex).toBe(sheet.rows.length - 1)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should not go to last row when the first row is active and previous is called', async () => {
    const { previous } = useInitiativeSheet(sheetComputed, update, nextTurn)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should soft reset the initiative sheet', async () => {
    mockSheet.value.activeIndex = mockSheet.value.rows.length - 1
    mockSheet.value.round = 4

    const { reset } = useInitiativeSheet(sheetComputed, update, nextTurn)

    expect(mockSheet.value.activeIndex).toBe(mockSheet.value.rows.length - 1)
    expect(mockSheet.value.round).toBe(4)

    reset(false)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should send the hard reset of the rows and select the first row', async () => {
    updateFn.mockClear()
    mockSheet.value.activeIndex = 2
    const rows = mockSheet.value.rows

    const { reset, selected } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    reset(true)

    expect(updateFn).toHaveBeenCalledWith(resetEncounter(rows, { hard: true }))
    expect(selected.value).toEqual({ [rows[0]!.id]: true })
  })

  it('Should skip dead monsters and select the next living row', async () => {
    mockSheet.value.rows = [
      { ...mockSheet.value.rows[0]!, type: 'player' },
      { ...mockSheet.value.rows[1]!, type: 'monster', hitPoints: 0 },
      { ...mockSheet.value.rows[2]!, type: 'monster' },
    ]

    const { next, selected } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    next()

    expect(mockSheet.value.activeIndex).toBe(2)
    expect(selected.value).toEqual({ [mockSheet.value.rows[2]!.id]: true })
  })

  it('Should leave the rows alone on a soft reset without readied actions', async () => {
    updateFn.mockClear()
    const { reset } = useInitiativeSheet(sheetComputed, update, nextTurn)

    reset(false)

    expect(updateFn).toHaveBeenCalledWith({ activeIndex: 0, round: 1 })
  })

  it('Should show all columns by default', async () => {
    const { columnVisibility } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    expect(columnVisibility.value).toStrictEqual({
      index: true,
      name: true,
      initiative: true,
      armorClass: true,
      hitPoints: true,
      conditions: true,
      note: true,
      deathSaves: true,
      concentration: true,
      modify: true,
    })
  })

  it('Should show all the selected columns', async () => {
    mockSheet.value.settings.rows = ['armorClass', 'hitPoints']
    mockSheet.value.settings.modified = true

    const { columnVisibility } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    expect(columnVisibility.value).toStrictEqual({
      index: true,
      name: true,
      initiative: true,
      armorClass: true,
      hitPoints: true,
      conditions: false,
      note: false,
      deathSaves: false,
      concentration: false,
      modify: false,
    })
  })

  it('Should show only the required columns', async () => {
    mockSheet.value.settings.rows = []
    mockSheet.value.settings.modified = true

    const { columnVisibility } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    expect(columnVisibility.value).toStrictEqual({
      index: true,
      name: true,
      initiative: true,
      armorClass: false,
      hitPoints: false,
      conditions: false,
      note: false,
      deathSaves: false,
      concentration: false,
      modify: false,
    })
  })

  it('Should expose the active row based on the current selection', () => {
    const { active } = useInitiativeSheet(sheetComputed, update, nextTurn)

    expect(active.value).toEqual(sheet.rows[0])
  })

  it('Should re-select the active row when the rows change without an existing match', async () => {
    const { selected } = useInitiativeSheet(sheetComputed, update, nextTurn)

    selected.value = { 'some-other-id': true }

    mockSheet.value = { ...mockSheet.value, rows: [...mockSheet.value.rows] }
    await nextTick()

    expect(selected.value).toEqual({ [sheet.rows[0]!.id]: true })
  })

  it('Should have no active row when the selection matches no row', () => {
    const { selected, active } = useInitiativeSheet(
      sheetComputed,
      update,
      nextTurn,
    )

    selected.value = { 'unknown-id': true }

    expect(active.value).toBeUndefined()
  })

  describe('keyboard shortcuts', () => {
    type KeyStrokeHandler = (e: Partial<KeyboardEvent>) => void

    function latestHandler(key: string): KeyStrokeHandler {
      const call = onKeyStrokeMock.mock.calls.findLast(([keys]) =>
        [keys].flat().includes(key),
      )

      return call![1] as KeyStrokeHandler
    }

    function pressKey(
      key: string,
      modifiers: Partial<
        Pick<
          KeyboardEvent,
          'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat' | 'target'
        >
      > = {},
    ): void {
      latestHandler(key)({
        key,
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        repeat: false,
        target: null,
        ...modifiers,
        preventDefault: vi.fn(),
      })
    }

    it('Should ignore key strokes without a shift or meta modifier', () => {
      useInitiativeSheet(sheetComputed, update, nextTurn)

      pressKey('ArrowRight')

      expect(mockSheet.value.activeIndex).toBe(0)
    })

    it('Should navigate to the next row on shift+ArrowRight', () => {
      useInitiativeSheet(sheetComputed, update, nextTurn)

      pressKey('ArrowRight', { shiftKey: true })

      expect(mockSheet.value.activeIndex).toBe(1)
    })

    it('Should navigate to the previous row on meta+ArrowLeft', () => {
      mockSheet.value.activeIndex = 1

      useInitiativeSheet(sheetComputed, update, nextTurn)

      pressKey('ArrowLeft', { metaKey: true })

      expect(mockSheet.value.activeIndex).toBe(0)
    })

    it('Should expand the active row on shift+Enter and collapse it again', () => {
      const { expanded } = useInitiativeSheet(sheetComputed, update, nextTurn)

      const currentId = sheet.rows[0]!.id

      pressKey('Enter', { shiftKey: true })

      expect(expanded.value).toEqual({ [currentId]: true })

      pressKey('Enter', { shiftKey: true })

      expect(expanded.value).toEqual({})
    })

    it.each(['input', 'textarea', 'select'])(
      'Should ignore shortcuts while typing in a %s',
      tag => {
        const { expanded } = useInitiativeSheet(sheetComputed, update, nextTurn)
        const target = document.createElement(tag)

        pressKey('ArrowRight', { shiftKey: true, target })
        pressKey('Enter', { shiftKey: true, target })

        expect(mockSheet.value.activeIndex).toBe(0)
        expect(expanded.value).toEqual({})
      },
    )

    it('Should do nothing when there is no sheet', () => {
      mockSheet.value = undefined as unknown as InitiativeSheet

      useInitiativeSheet(sheetComputed, update, nextTurn)

      expect(() => pressKey('ArrowRight', { shiftKey: true })).not.toThrow()
    })

    it('Should do nothing when the active row cannot be found', () => {
      mockSheet.value.activeIndex = 999

      useInitiativeSheet(sheetComputed, update, nextTurn)
      updateFn.mockClear()

      expect(() => pressKey('ArrowRight', { shiftKey: true })).not.toThrow()
      expect(updateFn).not.toHaveBeenCalled()
    })

    describe('row shortcuts', () => {
      function request() {
        return useRowShortcut().request
      }

      beforeEach(() => {
        request().value = undefined
        useRowShortcut().targetId.value = undefined
      })

      it('Should move the target with alt and the arrow keys', () => {
        const { target } = useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('ArrowDown', { altKey: true })
        expect(target.value?.id).toBe(sheet.rows[1]!.id)

        pressKey('ArrowUp', { altKey: true })
        pressKey('ArrowUp', { altKey: true })
        expect(target.value?.id).toBe(sheet.rows.at(-1)!.id)
      })

      it('Should act on the target instead of the current creature', () => {
        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('ArrowDown', { altKey: true })
        pressKey('d')

        expect(request().value).toEqual({
          rowId: sheet.rows[1]!.id,
          action: 'damage',
        })
      })

      it.each([
        {},
        { altKey: true, shiftKey: true },
        { altKey: true, metaKey: true },
        { altKey: true, ctrlKey: true },
        { altKey: true, target: document.createElement('input') },
      ])('Should not move the target with %o', modifiers => {
        const { target } = useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('ArrowDown', modifiers)

        expect(target.value?.id).toBe(sheet.rows[0]!.id)
      })

      it('Should go back to the current creature on escape', () => {
        const { target } = useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('ArrowDown', { altKey: true })
        pressKey('Escape')

        expect(target.value?.id).toBe(sheet.rows[0]!.id)
      })

      it('Should reset the target when the turn changes', async () => {
        const { target } = useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('ArrowDown', { altKey: true })
        pressKey('ArrowDown', { altKey: true })
        mockSheet.value = { ...mockSheet.value, activeIndex: 1 }
        await nextTick()

        expect(useRowShortcut().targetId.value).toBeUndefined()
        expect(target.value?.id).toBe(sheet.rows[1]!.id)
      })

      it.each([
        ['d', 'damage'],
        ['h', 'heal'],
        ['c', 'condition'],
      ])('Should request %s for the active row', (key, action) => {
        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey(key)

        expect(request().value).toEqual({ rowId: sheet.rows[0]!.id, action })
      })

      it.each([
        { shiftKey: true },
        { metaKey: true },
        { ctrlKey: true },
        { altKey: true },
        { repeat: true },
      ])('Should ignore the key with %o', modifiers => {
        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('d', modifiers)

        expect(request().value).toBeUndefined()
      })

      it('Should ignore the key while typing', () => {
        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('d', { target: document.createElement('input') })

        expect(request().value).toBeUndefined()
      })

      it('Should ignore the key inside a dialog', () => {
        const dialog = document.createElement('div')
        const button = document.createElement('button')

        dialog.setAttribute('role', 'dialog')
        dialog.appendChild(button)

        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('h', { target: button })

        expect(request().value).toBeUndefined()
      })

      it('Should do nothing without an active row', () => {
        mockSheet.value = { ...sheet, rows: [] }

        useInitiativeSheet(sheetComputed, update, nextTurn)

        pressKey('c')

        expect(request().value).toBeUndefined()
      })
    })
  })
})
