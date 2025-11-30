import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Health from '~/components/initiative/TableRow/Health.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface HealthTestMethods {
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
  updateBase: (form: { amount: number }, node: any) => Promise<void>
}

interface Props {
  item: InitiativeSheetRow
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row health', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Health, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display health values correctly', async () => {
    const health = 10
    const maxHealth = 20
    const maxHealthOld = 15
    const tempHealth = 5

    const component = await mountSuspended(Health, {
      props: {
        item: { ...props.item, health, maxHealth, maxHealthOld, tempHealth },
      },
      provide,
    })

    expect(component.get('[data-test-health]').text()).toBe(health.toString())
    expect(component.get('[data-test-max]').text()).toContain(maxHealth.toString())
    expect(component.get('[data-test-temp]').text()).toContain(tempHealth.toString())
  })

  it('Should show destructive styling when health is 0', async () => {
    const component = await mountSuspended(Health, {
      props: {
        item: { ...props.item, health: 0 },
      },
      provide,
    })

    expect(component.get('[data-test-trigger]').classes()).toContain('bg-destructive/20')
    expect(component.get('[data-test-health]').classes()).toContain('text-destructive')
  })

  it('Should show plus icon when health is not defined', async () => {
    const component = await mountSuspended(Health, {
      props: {
        item: { ...props.item, health: undefined },
      },
      provide,
    })

    expect(component.get('[data-test-empty]').isVisible()).toBeTruthy()
  })

  it('Should call updateRow when health changes are made', async () => {
    const component = await mountSuspended(Health, { props, provide })

    const vm = component.vm as unknown as HealthTestMethods
    await vm.updateRow({ health: 15 })

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()
    const resultRow = payload.rows[0]
    expect(resultRow?.health).toBe(15)
  })
})
