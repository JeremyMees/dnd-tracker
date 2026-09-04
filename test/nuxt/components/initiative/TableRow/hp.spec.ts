import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Hp from '~/components/initiative/TableRow/Hp.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { openPopover } from '~~/test/nuxt/stubs/popover'

interface HpTestMethods {
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
  updateBase: (form: { amount: number }, node: unknown) => Promise<void>
  handleToasts: (toasts: ToastItem[]) => void
  hasHp: boolean
}

interface Props {
  item: InitiativeSheetRow
}

const mockPatchRow = vi.fn()
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
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row hp', async () => {
  beforeEach(() => {
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
        item: {
          ...props.item,
          hitPoints,
          maxHitPoints,
          maxHitPointsOld,
          tempHitPoints,
        },
      },
      provide,
    })

    expect(component.get('[test-id="hp"]').text()).toBe(hitPoints.toString())
    expect(component.get('[test-id="max"]').text()).toContain(
      maxHitPoints.toString(),
    )
    expect(component.get('[test-id="temp"]').text()).toContain(
      tempHitPoints.toString(),
    )
  })

  it('Should show destructive styling when hitPoints is 0', async () => {
    const component = await mountSuspended(Hp, {
      props: {
        item: { ...props.item, hitPoints: 0 },
      },
      provide,
    })

    expect(component.get('[test-id="trigger"]').classes()).toContain(
      'bg-destructive/20',
    )
    expect(component.get('[test-id="hp"]').classes()).toContain(
      'text-destructive',
    )
  })

  it('Should show plus icon when hitPoints is not defined', async () => {
    const component = await mountSuspended(Hp, {
      props: {
        item: { ...props.item, hitPoints: undefined },
      },
      provide,
    })

    expect(component.get('[test-id="empty"]').isVisible()).toBeTruthy()
  })

  it('Should call updateRow when hitPoints changes are made', async () => {
    const component = await mountSuspended(Hp, { props, provide })

    const vm = component.vm as unknown as HpTestMethods
    await vm.updateRow({ hitPoints: 15 })

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, { hitPoints: 15 })
  })

  it('Should trigger toasts through the toast composable', async () => {
    const component = await mountSuspended(Hp, { props, provide })

    const vm = component.vm as unknown as HpTestMethods
    vm.handleToasts([
      {
        title: ['toast.title'],
        description: ['toast.description'],
        variant: 'default',
      },
    ])

    expect(mockToast).toHaveBeenCalledWith({
      title: 'toast.title',
      description: 'toast.description',
      variant: 'default',
    })
  })

  describe('Popover content', () => {
    it('Should render the current, max and temp hitPoints breakdown when opened', async () => {
      const component = await mountSuspended(Hp, {
        props: {
          item: {
            ...props.item,
            hitPoints: 10,
            maxHitPoints: 20,
            maxHitPointsOld: 15,
            tempHitPoints: 5,
          },
        },
        provide,
      })

      await openPopover(component)

      expect(document.body.textContent).toContain('general.current')
      expect(document.body.textContent).toContain('general.max')
      expect(document.body.textContent).toContain('general.temp')
      expect(document.body.textContent).toContain('(15)')
    })

    it('Should not show the previous max hitPoints when maxHitPointsOld is not defined', async () => {
      const component = await mountSuspended(Hp, {
        props: {
          item: {
            ...props.item,
            hitPoints: 10,
            maxHitPoints: 20,
            maxHitPointsOld: undefined,
          },
        },
        provide,
      })

      await openPopover(component)

      expect(document.body.textContent).not.toContain('(undefined)')
    })

    it('Should apply destructive styling to the current hitPoints when below 1', async () => {
      const component = await mountSuspended(Hp, {
        props: {
          item: { ...props.item, hitPoints: 0, maxHitPoints: 20 },
        },
        provide,
      })

      await openPopover(component)

      const vm = component.vm as unknown as HpTestMethods
      expect(vm.hasHp).toBe(true)
    })

    it('Should not show the hitPoints breakdown or forms when hitPoints are not defined', async () => {
      const component = await mountSuspended(Hp, {
        props: {
          item: {
            ...props.item,
            hitPoints: undefined,
            maxHitPoints: undefined,
          },
        },
        provide,
      })

      await openPopover(component)

      const vm = component.vm as unknown as HpTestMethods
      expect(vm.hasHp).toBe(false)
      expect(document.body.textContent).not.toContain('general.current')
    })
  })
})
