import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Hp from '~/components/initiative/TableRow/Hp.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/nuxt/fixtures/initiative-sheet'

interface HpTestMethods {
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

describe('Initiative table row hp', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Hp, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display hitPoints values correctly', async () => {
    const hitPoints = 10
    const maxHitPoints = 20
    const maxHitPointsOld = 15
    const tempHitPoints = 5

    const component = await mountSuspended(Hp, {
      props: {
        item: { ...props.item, hitPoints, maxHitPoints, maxHitPointsOld, tempHitPoints },
      },
      provide,
    })

    expect(component.get('[data-test-hp]').text()).toBe(hitPoints.toString())
    expect(component.get('[data-test-max]').text()).toContain(maxHitPoints.toString())
    expect(component.get('[data-test-temp]').text()).toContain(tempHitPoints.toString())
  })

  it('Should show destructive styling when hitPoints is 0', async () => {
    const component = await mountSuspended(Hp, {
      props: {
        item: { ...props.item, hitPoints: 0 },
      },
      provide,
    })

    expect(component.get('[data-test-trigger]').classes()).toContain('bg-destructive/20')
    expect(component.get('[data-test-hp]').classes()).toContain('text-destructive')
  })

  it('Should show plus icon when hitPoints is not defined', async () => {
    const component = await mountSuspended(Hp, {
      props: {
        item: { ...props.item, hitPoints: undefined },
      },
      provide,
    })

    expect(component.get('[data-test-empty]').isVisible()).toBeTruthy()
  })

  it('Should call updateRow when hitPoints changes are made', async () => {
    const component = await mountSuspended(Hp, { props, provide })

    const vm = component.vm as unknown as HpTestMethods
    await vm.updateRow({ hitPoints: 15 })

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as { rows: InitiativeSheetRow[] }
    expect(payload).toBeDefined()
    const resultRow = payload.rows[0]
    expect(resultRow?.hitPoints).toBe(15)
  })
})
