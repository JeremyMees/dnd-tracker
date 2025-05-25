import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Health from '~/components/initiative/TableRow/Health.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface HealthTestMethods {
  handleHpChanges: (amount: number, type: 'heal' | 'damage' | 'temp' | 'override' | 'override-reset') => InitiativeSheetRow
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
}

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row health', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockToast.mockClear()
  })

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

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(10, 'damage')
    await vm.updateRow(updatedRow)

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

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(10, 'damage')
    await vm.updateRow(updatedRow)

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()
    const resultRow = payload.rows[0]
    expect(resultRow).toBeDefined()
    expect(resultRow!.health).toBe(0)
    expect(resultRow!.concentration).toBe(false)
    expect(resultRow!.conditions).toHaveLength(0)
  })

  it('Should show concentration toast when taking damage with concentration', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 20,
          concentration: true,
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(5, 'damage')
    await vm.updateRow(updatedRow)

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.concentration.title'),
      description: expect.stringMatching('components.initiativeTable.concentration.text'),
      variant: 'info',
    })
  })

  it('Should show downed toast when health reaches 0', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 5,
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(10, 'damage')
    await vm.updateRow(updatedRow)

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.downed.title'),
      description: expect.stringMatching('components.initiativeTable.downed.text'),
      variant: 'info',
    })
  })

  it('Should show death toast when health goes below negative max health', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 10,
          maxHealth: 20,
          type: 'player',
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(30, 'damage')
    await vm.updateRow(updatedRow)

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.initiativeTable.died.title'),
      description: expect.stringMatching('components.initiativeTable.died.textMinHP'),
      variant: 'info',
    })
  })

  it('Should show stable toast when death saves are successful', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 0,
          maxHealth: 20,
          type: 'player',
          deathSaves: {
            save: [true, true, true],
            fail: [false, false, false],
          },
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(10, 'temp')
    await vm.updateRow(updatedRow)

    expect(component.get('[data-test-health]').text()).toBe('0')
  })

  it('Should set health to 0 when negative values are not allowed', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 10,
          maxHealth: 20,
          tempHealth: 0,
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(15, 'damage')
    await vm.updateRow(updatedRow)

    expect(updatedRow.health).toBe(0)
  })

  it('Should allow negative health when negative values are allowed', async () => {
    const component = await mountSuspended(Health, {
      props: {
        ...props,
        item: {
          ...props.item,
          health: 10,
          maxHealth: 20,
          tempHealth: 0,
        },
        sheet: {
          ...sheet,
          settings: {
            ...sheet.settings,
            negative: true,
          },
        },
      },
    })

    const vm = component.vm as unknown as HealthTestMethods
    const updatedRow = vm.handleHpChanges(15, 'damage')
    await vm.updateRow(updatedRow)

    expect(updatedRow.health).toBe(-5)
  })
})
