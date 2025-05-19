import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Health from '~/components/initiative/TableRow/Health.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row health', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Health, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display health values correctly', async () => {
    const health = 10
    const maxHealth = 20
    const maxHealthOld = 15
    const tempHealth = 5

    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: { ...props.item, health, maxHealth, maxHealthOld, tempHealth },
      },
    })

    expect(component.get('[data-test-health]').text()).toBe(health.toString())
    expect(component.get('[data-test-max]').text()).toContain(maxHealth.toString())
    expect(component.get('[data-test-temp]').text()).toContain(tempHealth.toString())
  })

  it('Should show destructive styling when health is 0', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: { ...props.item, health: 0 },
      },
    })

    expect(component.get('[data-test-trigger]').classes()).toContain('bg-destructive/20')
    expect(component.get('[data-test-health]').classes()).toContain('text-destructive')
  })

  it('Should show plus icon when health is not defined', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: { ...props.item, health: undefined },
      },
    })

    expect(component.get('[data-test-empty]').isVisible()).toBeTruthy()
  })

  it('Should handle death saves when health reaches 0', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 5,
          type: 'player',
          deathSaves: {
            fail: [false, false, false],
            save: [false, false, false],
          },
        },
      },
    })

    // Simulate damage that would bring health to 0
    const updatedRow = component.vm.handleHpChanges(10, 'damage')
    await component.vm.updateRow(updatedRow)

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()
    const resultRow = payload.rows[0]
    expect(resultRow).toBeDefined()
    expect(resultRow?.deathSaves?.fail).toEqual([true, true, false])
  })

  it('Should remove concentration and conditions when health reaches 0', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 5,
          concentration: true,
          conditions: [{ name: 'blinded', desc: 'Cannot see' }],
        },
      },
    })

    // Simulate damage that would bring health to 0
    const updatedRow = component.vm.handleHpChanges(10, 'damage')
    await component.vm.updateRow(updatedRow)

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()
    const resultRow = payload.rows[0]
    expect(resultRow).toBeDefined()
    expect(resultRow!.concentration).toBe(false)
    expect(resultRow!.conditions).toHaveLength(0)
  })
})
