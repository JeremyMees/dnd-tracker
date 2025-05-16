import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sheet } from '../fixtures/initiative-sheet'
import { useInitiativeSheet } from '~/composables/useInitiativeSheet'

const updateFn = vi.fn()

const mockSheet = ref<InitiativeSheet>({ ...sheet })

const update = async (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => {
  mockSheet.value = { ...mockSheet.value, ...payload }

  updateFn(payload)
}

describe('useInitiativeSheet', async () => {
  beforeEach(() => mockSheet.value = { ...sheet })

  it('Should set the first row as selected and navigate properly', async () => {
    const { next, previous } = useInitiativeSheet(
      computed(() => mockSheet.value),
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
      computed(() => mockSheet.value),
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
      computed(() => mockSheet.value),
      update,
    )

    expect(mockSheet.value.round).toBe(2)

    previous()

    expect(mockSheet.value.activeIndex).toBe(sheet.rows.length - 1)
    expect(mockSheet.value.round).toBe(1)
  })

  it('Should not go to last row when the first row is active and previous is called', async () => {
    const { previous } = useInitiativeSheet(
      computed(() => mockSheet.value),
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
      computed(() => mockSheet.value),
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
    const currentAc = firstItem.ac
    const currentHealth = firstItem.health
    const maxAcOld = firstItem.maxAcOld
    const maxHealthOld = firstItem.maxHealthOld

    const { reset } = useInitiativeSheet(
      computed(() => mockSheet.value),
      update,
    )

    expect(mockSheet.value.activeIndex).toBe(mockSheet.value.rows.length - 1)
    expect(mockSheet.value.round).toBe(4)
    expect(mockSheet.value.rows[0]!.ac).toBe(currentAc)
    expect(mockSheet.value.rows[0]!.health).toBe(currentHealth)
    expect(mockSheet.value.rows[0]!.tempAc).toBe(5)
    expect(mockSheet.value.rows[0]!.tempHealth).toBe(5)
    expect(mockSheet.value.rows[0]!.concentration).toBe(true)
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([true, false, false])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([true, false, false])
    expect(mockSheet.value.rows[0]!.conditions.length).toBe(1)

    reset(true)

    expect(mockSheet.value.activeIndex).toBe(0)
    expect(mockSheet.value.round).toBe(1)
    expect(mockSheet.value.rows[0]!.ac).toBe(maxAcOld)
    expect(mockSheet.value.rows[0]!.health).toBe(maxHealthOld)
    expect(mockSheet.value.rows[0]!.maxAcOld).toBe(undefined)
    expect(mockSheet.value.rows[0]!.maxHealthOld).toBe(undefined)
    expect(mockSheet.value.rows[0]!.tempAc).toBe(undefined)
    expect(mockSheet.value.rows[0]!.tempHealth).toBe(undefined)
    expect(mockSheet.value.rows[0]!.concentration).toBe(false)
    expect(mockSheet.value.rows[0]!.deathSaves!.fail).toEqual([false, false, false])
    expect(mockSheet.value.rows[0]!.deathSaves!.save).toEqual([false, false, false])
    expect(mockSheet.value.rows[0]!.conditions.length).toBe(0)
  })

  it('Should show all columns by default', async () => {
    const { columnVisibility } = useInitiativeSheet(
      computed(() => mockSheet.value),
      update,
    )

    expect(columnVisibility.value).toStrictEqual({
      index: true,
      name: true,
      initiative: true,
      ac: true,
      health: true,
      conditions: true,
      note: true,
      deathSaves: true,
      concentration: true,
      modify: true,
    })
  })

  it('Should show all the selected columns', async () => {
    mockSheet.value.settings.rows = ['index', 'name', 'initiative', 'ac', 'health']
    mockSheet.value.settings.modified = true

    const { columnVisibility } = useInitiativeSheet(
      computed(() => mockSheet.value),
      update,
    )

    expect(columnVisibility.value).toStrictEqual({
      index: true,
      name: true,
      initiative: true,
      ac: true,
      health: true,
      conditions: false,
      note: false,
      deathSaves: false,
      concentration: false,
      modify: false,
    })
  })
})
