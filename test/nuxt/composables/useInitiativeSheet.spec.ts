import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sheet } from '../../fixtures/initiative-sheet'
import { useInitiativeSheet } from '~/composables/useInitiativeSheet'

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

describe('useInitiativeSheet', async () => {
  beforeEach(() => (mockSheet.value = { ...sheet }))

  it('Should set the first row as selected and navigate properly', async () => {
    const { next, previous } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.activeIndex).toBe(0)

    next()

    expect(mockSheet.value.activeIndex).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
  })

  it('Should go to first row when the last row is active and next is called', async () => {
    mockSheet.value.activeIndex = sheet.rows.length - 1
    const { next } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.round).toBe(1)

    next()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(2)
  })

  it('Should go to last row when the first row is active the round is not 1 and previous is called', async () => {
    mockSheet.value.round = 2

    const { previous } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.round).toBe(2)

    previous()

    expect(mockSheet.value.activeIndex).toBe(sheet.rows.length - 1)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should not go to last row when the first row is active and previous is called', async () => {
    const { previous } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should soft reset the initiative sheet', async () => {
    mockSheet.value.activeIndex = mockSheet.value.rows.length - 1
    mockSheet.value.round = 4

    const { reset } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.activeIndex).toBe(mockSheet.value.rows.length - 1)
    expect(mockSheet.value.round).toBe(4)

    reset(false)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should hard reset the initiative sheet', async () => {
    mockSheet.value.activeIndex = mockSheet.value.rows.length - 1
    mockSheet.value.round = 4

    const firstItem = mockSheet.value.rows[0]!
    const currentAc = firstItem.armorClass
    const currentHp = firstItem.hitPoints
    const maxAcOld = firstItem.maxArmorClassOld
    const maxHpOld = firstItem.maxHitPointsOld

    const { reset } = useInitiativeSheet(sheetComputed, update)

    expect(mockSheet.value.activeIndex).toBe(mockSheet.value.rows.length - 1)
    expect(mockSheet.value.round).toBe(4)
    expect(mockSheet.value.rows[0]!.armorClass).toBe(currentAc)
    expect(mockSheet.value.rows[0]!.hitPoints).toBe(currentHp)
    expect(mockSheet.value.rows[0]!.tempArmorClass).toBe(5)
    expect(mockSheet.value.rows[0]!.tempHitPoints).toBe(5)
    expect(mockSheet.value.rows[0]!.concentration).toBeTruthy()
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([
      true,
      false,
      false,
    ])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([
      true,
      false,
      false,
    ])
    expect(mockSheet.value.rows[0]!.conditions.length).toBe(1)

    reset(true)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
    expect(mockSheet.value.rows[0]!.armorClass).toBe(maxAcOld)
    expect(mockSheet.value.rows[0]!.hitPoints).toBe(maxHpOld)
    expect(mockSheet.value.rows[0]!.maxArmorClassOld).toBe(undefined)
    expect(mockSheet.value.rows[0]!.maxHitPointsOld).toBe(undefined)
    expect(mockSheet.value.rows[0]!.tempArmorClass).toBe(undefined)
    expect(mockSheet.value.rows[0]!.tempHitPoints).toBe(undefined)
    expect(mockSheet.value.rows[0]!.concentration).toBeFalsy()
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([
      false,
      false,
      false,
    ])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([
      false,
      false,
      false,
    ])
    expect(mockSheet.value.rows[0]!.conditions.length).toBe(0)
  })

  it('Should show all columns by default', async () => {
    const { columnVisibility } = useInitiativeSheet(sheetComputed, update)

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

    const { columnVisibility } = useInitiativeSheet(sheetComputed, update)

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

    const { columnVisibility } = useInitiativeSheet(sheetComputed, update)

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
    const { active } = useInitiativeSheet(sheetComputed, update)

    expect(active.value).toEqual(sheet.rows[0])
  })

  it('Should re-select the active row when the rows change without an existing match', async () => {
    const { selected } = useInitiativeSheet(sheetComputed, update)

    selected.value = { 'some-other-id': true }

    mockSheet.value = { ...mockSheet.value, rows: [...mockSheet.value.rows] }
    await nextTick()

    expect(selected.value).toEqual({ [sheet.rows[0]!.id]: true })
  })

  it('Should have no active row when the selection matches no row', () => {
    const { selected, active } = useInitiativeSheet(sheetComputed, update)

    selected.value = { 'unknown-id': true }

    expect(active.value).toBeUndefined()
  })

  describe('keyboard shortcuts', () => {
    type KeyStrokeHandler = (e: {
      key: string
      shiftKey: boolean
      metaKey: boolean
      preventDefault: () => void
    }) => void

    function latestHandler(): KeyStrokeHandler {
      return onKeyStrokeMock.mock.calls.at(-1)![1] as KeyStrokeHandler
    }

    function pressKey(
      key: string,
      modifiers: { shiftKey?: boolean; metaKey?: boolean } = {},
    ): void {
      latestHandler()({
        key,
        shiftKey: false,
        metaKey: false,
        ...modifiers,
        preventDefault: vi.fn(),
      })
    }

    it('Should ignore key strokes without a shift or meta modifier', () => {
      useInitiativeSheet(sheetComputed, update)

      pressKey('ArrowRight')

      expect(mockSheet.value.activeIndex).toBe(0)
    })

    it('Should navigate to the next row on shift+ArrowRight', () => {
      useInitiativeSheet(sheetComputed, update)

      pressKey('ArrowRight', { shiftKey: true })

      expect(mockSheet.value.activeIndex).toBe(1)
    })

    it('Should navigate to the previous row on meta+ArrowLeft', () => {
      mockSheet.value.activeIndex = 1

      useInitiativeSheet(sheetComputed, update)

      pressKey('ArrowLeft', { metaKey: true })

      expect(mockSheet.value.activeIndex).toBe(0)
    })

    it('Should expand the active row on shift+Enter and collapse it again', () => {
      const { expanded } = useInitiativeSheet(sheetComputed, update)

      const currentId = sheet.rows[0]!.id

      pressKey('Enter', { shiftKey: true })

      expect(expanded.value).toEqual({ [currentId]: true })

      pressKey('Enter', { shiftKey: true })

      expect(expanded.value).toEqual({})
    })

    it('Should do nothing when there is no sheet', () => {
      mockSheet.value = undefined as unknown as InitiativeSheet

      useInitiativeSheet(sheetComputed, update)

      expect(() => pressKey('ArrowRight', { shiftKey: true })).not.toThrow()
    })

    it('Should do nothing when the active row cannot be found', () => {
      mockSheet.value.activeIndex = 999

      useInitiativeSheet(sheetComputed, update)
      updateFn.mockClear()

      expect(() => pressKey('ArrowRight', { shiftKey: true })).not.toThrow()
      expect(updateFn).not.toHaveBeenCalled()
    })
  })
})
