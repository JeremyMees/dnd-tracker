import { resetToast, toast } from '~~/test/nuxt/stubs/toast'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Hp from '~/components/initiative/TableRow/Hp.vue'
import { useRowShortcut } from '~/composables/useRowShortcut'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import {
  bloodiedCondition,
  storedBloodiedCondition,
} from '~~/test/fixtures/bloodied-condition'
import { openPopover } from '~~/test/nuxt/stubs/popover'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface HpTestMethods {
  apply: (change: DndHpChange) => Promise<void>
  handleToasts: (toasts: ToastItem[]) => void
  hasHp: boolean
}

interface Props {
  item: InitiativeSheetRow
}

const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)
const mockConditions = ref<DndCondition[]>([])

vi.mock('~/queries/srd', () => ({
  useConditionsListing: () => ({ data: mockConditions }),
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
    mockConditions.value = []
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(Hp, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display hitPoints values correctly', async () => {
    const hitPoints = 10
    const maxHitPoints = 20
    const maxHitPointsOld = 15
    const tempHitPoints = 5

    const component = await mountWithTooltips(Hp, {
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
    const component = await mountWithTooltips(Hp, {
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
    const component = await mountWithTooltips(Hp, {
      props: {
        item: { ...props.item, hitPoints: undefined },
      },
      provide,
    })

    expect(component.get('[test-id="empty"]').isVisible()).toBeTruthy()
  })

  describe('apply', () => {
    const item = {
      ...props.item,
      hitPoints: 80,
      maxHitPoints: 100,
      tempHitPoints: 0,
      concentration: false,
    }

    async function applyTo(row: InitiativeSheetRow, change: DndHpChange) {
      const component = await mountWithTooltips(Hp, {
        props: { item: row },
        provide,
      })

      await (component.vm as unknown as HpTestMethods).apply(change)
    }

    beforeEach(() => {
      mockPatchRow.mockReset()
      resetToast()
    })

    it('Should patch only the changed fields', async () => {
      await applyTo(item, { type: 'heal', amount: 5 })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { hitPoints: 85 })
    })

    it('Should add bloodied when damage drops the row to half hp', async () => {
      mockConditions.value = [bloodiedCondition]

      await applyTo(item, { type: 'damage', rolls: [{ amount: 30 }] })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, {
        hitPoints: 50,
        conditions: [...item.conditions, storedBloodiedCondition],
      })
    })

    it('Should remove bloodied when a heal lifts the row above half hp', async () => {
      mockConditions.value = [bloodiedCondition]

      await applyTo(
        { ...item, hitPoints: 40, conditions: [storedBloodiedCondition] },
        { type: 'heal', amount: 60 },
      )

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, {
        hitPoints: 100,
        conditions: [],
      })
    })

    it('Should leave conditions alone when the sheet has automatic bloodied switched off', async () => {
      const settings: InitiativeSettings = {
        ...sheet.settings,
        bloodied: false,
      }

      mockConditions.value = [bloodiedCondition]
      mockSheet.value = { ...sheet, settings }

      await applyTo(item, { type: 'damage', rolls: [{ amount: 30 }] })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { hitPoints: 50 })
    })

    it('Should set a new base', async () => {
      await applyTo(
        { ...item, maxHitPointsOld: 90 },
        { type: 'base', amount: 60 },
      )

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, {
        hitPoints: 60,
        maxHitPoints: 60,
        maxHitPointsOld: null,
      })
    })

    it('Should show the messages of the change', async () => {
      await applyTo(
        { ...item, concentration: true },
        { type: 'damage', rolls: [{ amount: 10 }] },
      )

      expect(toast.info).toHaveBeenCalledWith(
        'components.initiativeTable.concentration.title',
        expect.anything(),
      )
    })

    it('Should not patch without a sheet', async () => {
      mockSheet.value = undefined as never

      await applyTo(item, { type: 'heal', amount: 5 })

      expect(mockPatchRow).not.toHaveBeenCalled()
    })
  })

  it('Should trigger toasts through the toast composable', async () => {
    const component = await mountWithTooltips(Hp, { props, provide })

    const vm = component.vm as unknown as HpTestMethods
    vm.handleToasts([
      {
        title: ['toast.title'],
        description: ['toast.description'],
        variant: 'default',
      },
    ])

    expect(toast).toHaveBeenCalledWith('toast.title', {
      description: 'toast.description',
    })
  })

  describe('Popover content', () => {
    it('Should render the current, max and temp hitPoints breakdown when opened', async () => {
      const component = await mountWithTooltips(Hp, {
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
      const component = await mountWithTooltips(Hp, {
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
      const component = await mountWithTooltips(Hp, {
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
      const component = await mountWithTooltips(Hp, {
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

  describe('Shortcuts', () => {
    const item = { ...props.item, hitPoints: 10, maxHitPoints: 20 }

    it.each(['damage', 'heal'] as const)(
      'Should open with the %s intent when its shortcut is used',
      async action => {
        const component = await mountWithTooltips(Hp, {
          props: { item },
          provide,
        })

        useRowShortcut().trigger(item.id, action)
        await vi.waitFor(() => {
          expect(
            component.findComponent({ name: 'FormHpUpdate' }).exists(),
          ).toBe(true)
        })

        expect(
          component.findComponent({ name: 'FormHpUpdate' }).props('intent'),
        ).toBe(action)

        component.unmount()
      },
    )

    it('Should show the damage and heal shortcuts only on the target', async () => {
      const { targetId } = useRowShortcut()
      const component = await mountWithTooltips(Hp, {
        props: { item },
        provide,
      })
      const tooltip = () =>
        component.get('[test-id="trigger"]').findComponent({ name: 'Tooltip' })

      expect(tooltip().props('disabled')).toBe(false)

      targetId.value = sheet.rows[1]!.id
      await nextTick()

      expect(tooltip().props('disabled')).toBe(true)

      targetId.value = undefined
      component.unmount()
    })

    it('Should ignore shortcuts for another row', async () => {
      const component = await mountWithTooltips(Hp, {
        props: { item },
        provide,
      })

      useRowShortcut().trigger('another-row', 'damage')
      await nextTick()

      expect(component.findComponent({ name: 'FormHpUpdate' }).exists()).toBe(
        false,
      )

      useRowShortcut().request.value = undefined
      component.unmount()
    })
  })
})
