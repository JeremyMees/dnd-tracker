import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Ac from '~/components/initiative/TableRow/Ac.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { openPopover } from '~~/test/nuxt/stubs/popover'

interface AcTestMethods {
  handleAcChanges: (
    amount: number,
    type: 'add' | 'remove' | 'temp' | 'override' | 'override-reset',
  ) => InitiativeSheetRow
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
  hasArmorClass: boolean
}

interface Props {
  item: InitiativeSheetRow
}

const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row ac', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Ac, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display AC values correctly', async () => {
    const armorClass = 1
    const maxArmorClass = 15
    const maxArmorClassOld = 10
    const tempArmorClass = 5

    const component = await mountSuspended(Ac, {
      props: {
        item: {
          ...props.item,
          armorClass,
          maxArmorClass,
          maxArmorClassOld,
          tempArmorClass,
        },
      },
      provide,
    })

    expect(component.get('[test-id="ac"]').text()).toBe(armorClass.toString())
    expect(component.get('[test-id="max"]').text()).toContain(
      maxArmorClass.toString(),
    )
    expect(component.get('[test-id="temp"]').text()).toContain(
      tempArmorClass.toString(),
    )
  })

  it('Should show destructive styling when AC is 0', async () => {
    const component = await mountSuspended(Ac, {
      props: {
        item: { ...props.item, armorClass: 0 },
      },
      provide,
    })

    expect(component.get('[test-id="trigger"]').classes()).toContain(
      'bg-destructive/20',
    )
    expect(component.get('[test-id="ac"]').classes()).toContain(
      'text-destructive',
    )
  })

  it('Should show plus icon when AC is not defined', async () => {
    const component = await mountSuspended(Ac, {
      props: {
        ...props,
        item: { ...props.item, armorClass: undefined },
      },
      provide,
    })

    expect(component.get('[test-id="empty"]').isVisible()).toBeTruthy()
  })

  it('Should set AC to 0 when negative values are not allowed', async () => {
    const component = await mountSuspended(Ac, {
      props: {
        item: {
          ...props.item,
          armorClass: 10,
          maxArmorClass: 20,
          tempArmorClass: 0,
        },
      },
      provide,
    })

    const vm = component.vm as unknown as AcTestMethods
    const updatedRow = vm.handleAcChanges(15, 'remove')
    await vm.updateRow(updatedRow)

    expect(updatedRow.armorClass).toBe(0)
    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      armorClass: 0,
    })
  })

  it('Should allow negative AC when negative values are allowed', async () => {
    mockSheet.value = {
      ...sheet,
      settings: {
        ...sheet.settings,
        negative: true,
      } as InitiativeSheet['settings'],
    }

    const component = await mountSuspended(Ac, {
      props: {
        item: {
          ...props.item,
          armorClass: 10,
          maxArmorClass: 20,
          tempArmorClass: 0,
        },
      },
      provide,
    })

    const vm = component.vm as unknown as AcTestMethods
    const updatedRow = vm.handleAcChanges(15, 'remove')
    await vm.updateRow(updatedRow)

    expect(updatedRow.armorClass).toBe(-5)
  })

  describe('handleAcChanges', () => {
    it('Should add to the armor class', async () => {
      const component = await mountSuspended(Ac, {
        props: { item: { ...props.item, armorClass: 10, maxArmorClass: 20 } },
        provide,
      })

      const vm = component.vm as unknown as AcTestMethods
      const updatedRow = vm.handleAcChanges(5, 'add')

      expect(updatedRow.armorClass).toBe(15)
    })

    it('Should set a temporary armor class', async () => {
      const component = await mountSuspended(Ac, {
        props: { item: { ...props.item, armorClass: 10, maxArmorClass: 20 } },
        provide,
      })

      const vm = component.vm as unknown as AcTestMethods
      const updatedRow = vm.handleAcChanges(3, 'temp')

      expect(updatedRow.tempArmorClass).toBe(3)
    })

    it('Should override the max armor class', async () => {
      const component = await mountSuspended(Ac, {
        props: { item: { ...props.item, armorClass: 10, maxArmorClass: 20 } },
        provide,
      })

      const vm = component.vm as unknown as AcTestMethods
      const updatedRow = vm.handleAcChanges(25, 'override')

      expect(updatedRow.maxArmorClass).toBe(25)
      expect(updatedRow.maxArmorClassOld).toBe(20)
    })

    it('Should reset an overridden max armor class', async () => {
      const component = await mountSuspended(Ac, {
        props: {
          item: {
            ...props.item,
            armorClass: 15,
            maxArmorClass: 25,
            maxArmorClassOld: 20,
          },
        },
        provide,
      })

      const vm = component.vm as unknown as AcTestMethods
      const updatedRow = vm.handleAcChanges(20, 'override-reset')

      expect(updatedRow.maxArmorClass).toBe(20)
      expect(updatedRow.maxArmorClassOld).toBeUndefined()
    })
  })

  describe('Popover content', () => {
    it('Should render the current, max and temp AC breakdown when opened', async () => {
      const component = await mountSuspended(Ac, {
        props: {
          item: {
            ...props.item,
            armorClass: 10,
            maxArmorClass: 20,
            maxArmorClassOld: 15,
            tempArmorClass: 5,
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

    it('Should show the previous max armor class even when it is 0', async () => {
      const component = await mountSuspended(Ac, {
        props: {
          item: {
            ...props.item,
            armorClass: 10,
            maxArmorClass: 20,
            maxArmorClassOld: 0,
          },
        },
        provide,
      })

      await openPopover(component)

      expect(document.body.textContent).toContain('(0)')
    })

    it('Should not show the AC breakdown or forms when armorClass is not defined', async () => {
      const component = await mountSuspended(Ac, {
        props: {
          item: {
            ...props.item,
            armorClass: undefined,
            maxArmorClass: undefined,
          },
        },
        provide,
      })

      await openPopover(component)

      const vm = component.vm as unknown as AcTestMethods
      expect(vm.hasArmorClass).toBe(false)
      expect(document.body.textContent).not.toContain('general.current')
    })
  })
})
