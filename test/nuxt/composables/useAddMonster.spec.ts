import { resetToast, toast } from '~~/test/nuxt/stubs/toast'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { ShallowUnwrapRef } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAddMonster } from '~/composables/useAddMonster'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'
import { sheet as sheetFixture } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'

type AddMonster = ReturnType<typeof useAddMonster>

async function mountAddMonster(provide: Record<symbol, unknown> = {}) {
  const component = await mountSuspended(
    defineComponent({
      setup: () => useAddMonster(),
      template: '<div />',
    }),
    { global: { provide } },
  )

  return {
    component,
    vm: component.vm as unknown as ShallowUnwrapRef<AddMonster>,
  }
}

let component: VueWrapper | undefined

describe('useAddMonster', () => {
  beforeEach(() => {
    resetToast()
  })

  afterEach(() => {
    component?.unmount()
    component = undefined
    vi.restoreAllMocks()
  })

  it('Should not be available outside an encounter', async () => {
    const mounted = await mountAddMonster()
    component = mounted.component

    expect(mounted.vm.isAvailable).toBe(false)

    await mounted.vm.addMonster(dndMonsterFixture)

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('Should append the monster to the encounter and toast it', async () => {
    const injected = createInitiativeSheetProvide()
    const mounted = await mountAddMonster(injected.provide)
    component = mounted.component

    expect(mounted.vm.isAvailable).toBe(true)
    expect(mounted.vm.isFull).toBe(false)

    await mounted.vm.addMonster(dndMonsterFixture)

    expect(injected.editRows).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...sheetFixture.rows.map(row =>
          expect.objectContaining({ id: row.id }),
        ),
        expect.objectContaining({ name: dndMonsterFixture.name }),
      ]),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'components.initiativeTable.bestiary.added',
      { description: 'components.initiativeTable.bestiary.addedDescription' },
    )
  })

  it('Should roll the initiative of the added monster', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const injected = createInitiativeSheetProvide()
    const mounted = await mountAddMonster(injected.provide)
    component = mounted.component

    await mounted.vm.addMonster({ ...dndMonsterFixture, initiativeBonus: 2 })

    const rows = injected.editRows.mock.calls[0]![0] as InitiativeSheetRow[]

    expect(rows.find(row => row.name === dndMonsterFixture.name)).toEqual(
      expect.objectContaining({ initiative: 13 }),
    )
  })

  it('Should not roll the initiative when the setting is off', async () => {
    const injected = createInitiativeSheetProvide({
      ...sheetFixture,
      settings: { ...sheetFixture.settings!, autoRollInitiative: false },
    })
    const mounted = await mountAddMonster(injected.provide)
    component = mounted.component

    await mounted.vm.addMonster(dndMonsterFixture)

    expect(injected.editRows).toHaveBeenCalledWith([
      ...sheetFixture.rows,
      expect.objectContaining({
        name: dndMonsterFixture.name,
        initiative: -1,
      }),
    ])
  })

  it('Should be full when the encounter has the maximum amount of rows', async () => {
    const injected = createInitiativeSheetProvide({
      ...sheetFixture,
      rows: Array.from({ length: 50 }, (_, index) => ({
        ...sheetFixture.rows[0]!,
        id: `row-${index}`,
      })),
    })
    const mounted = await mountAddMonster(injected.provide)
    component = mounted.component

    expect(mounted.vm.isFull).toBe(true)
  })
})
