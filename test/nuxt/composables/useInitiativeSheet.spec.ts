import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sheet } from '../fixtures/initiative-sheet'
import { useInitiativeSheet } from '~/composables/useInitiativeSheet'

const updateFn = vi.fn()

const mockSheet = ref<any>({ ...sheet })

const sheetComputed = {
  get value() {
    return mockSheet.value
  },
} as unknown as ComputedRef<InitiativeSheet | undefined>

const update = async (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => {
  Object.assign(mockSheet.value, payload)

  updateFn(payload)
}

describe('useInitiativeSheet', async () => {
  beforeEach(() => mockSheet.value = { ...sheet })

  it('Should set the first row as selected and navigate properly', async () => {
    const { next, previous } = useInitiativeSheet(
      sheetComputed,
      update,
    )

    expect(mockSheet.value.activeIndex).toBe(0)

    next()

    expect(mockSheet.value.activeIndex).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
  })

  it('Should go to first row when the last row is active and next is called', async () => {
    mockSheet.value.activeIndex = sheet.rows.length - 1
    const { next } = useInitiativeSheet(
      sheetComputed,
      update,
    )

    expect(mockSheet.value.round).toBe(1)

    next()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(2)
  })

  it('Should go to last row when the first row is active the round is not 1 and previous is called', async () => {
    mockSheet.value.round = 2

    const { previous } = useInitiativeSheet(
      sheetComputed,
      update,
    )

    expect(mockSheet.value.round).toBe(2)

    previous()

    expect(mockSheet.value.activeIndex).toBe(sheet.rows.length - 1)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should not go to last row when the first row is active and previous is called', async () => {
    const { previous } = useInitiativeSheet(
      sheetComputed,
      update,
    )

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)

    previous()

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should soft reset the initiative sheet', async () => {
    mockSheet.value.activeIndex = mockSheet.value.rows.length - 1
    mockSheet.value.round = 4

    const { reset } = useInitiativeSheet(
      sheetComputed,
      update,
    )

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

    const { reset } = useInitiativeSheet(
      sheetComputed,
      update,
    )

    expect(mockSheet.value.activeIndex).toBe(mockSheet.value.rows.length - 1)
    expect(mockSheet.value.round).toBe(4)
    expect(mockSheet.value.rows[0]!.armorClass).toBe(currentAc)
    expect(mockSheet.value.rows[0]!.hitPoints).toBe(currentHp)
    expect(mockSheet.value.rows[0]!.tempArmorClass).toBe(5)
    expect(mockSheet.value.rows[0]!.tempHitPoints).toBe(5)
    expect(mockSheet.value.rows[0]!.concentration).toBeTruthy()
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([true, false, false])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([true, false, false])
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
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([false, false, false])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([false, false, false])
    expect(mockSheet.value.rows[0]!.conditions.length).toBe(0)
  })

  it('Should show all columns by default', async () => {
    const { columnVisibility } = useInitiativeSheet(
      sheetComputed,
      update,
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
})
