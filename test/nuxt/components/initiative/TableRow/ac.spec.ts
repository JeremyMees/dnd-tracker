import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Ac from '~/components/initiative/TableRow/Ac.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface AcTestMethods {
  handleAcChanges: (
    amount: number,
    type: 'add' | 'remove' | 'temp' | 'override' | 'override-reset',
  ) => InitiativeSheetRow
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
}

interface Props {
  item: InitiativeSheetRow
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
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
})
