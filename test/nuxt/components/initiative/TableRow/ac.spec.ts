import { describe, expect, it, vi, beforeEach } from 'vitest'
import Ac from '~/components/initiative/TableRow/Ac.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { openPopover } from '~~/test/nuxt/stubs/popover'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface AcTestMethods {
  apply: (change: DndAcChange) => Promise<void>
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
    const component = await mountWithTooltips(Ac, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display AC values correctly', async () => {
    const armorClass = 1
    const maxArmorClass = 15
    const maxArmorClassOld = 10
    const tempArmorClass = 5

    const component = await mountWithTooltips(Ac, {
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
    const component = await mountWithTooltips(Ac, {
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
    const component = await mountWithTooltips(Ac, {
      props: {
        ...props,
        item: { ...props.item, armorClass: undefined },
      },
      provide,
    })

    expect(component.get('[test-id="empty"]').isVisible()).toBeTruthy()
  })

  describe('apply', () => {
    const item = {
      ...props.item,
      armorClass: 10,
      maxArmorClass: 20,
      tempArmorClass: 0,
    }

    beforeEach(() => {
      mockPatchRow.mockReset()
    })

    it('Should patch only the changed fields, clamped at 0', async () => {
      const component = await mountWithTooltips(Ac, {
        props: { item },
        provide,
      })

      await (component.vm as unknown as AcTestMethods).apply({
        type: 'remove',
        amount: 15,
      })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { armorClass: 0 })
    })

    it('Should allow negative AC when the sheet allows it', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          negative: true,
        } as InitiativeSheet['settings'],
      }

      const component = await mountWithTooltips(Ac, {
        props: { item },
        provide,
      })

      await (component.vm as unknown as AcTestMethods).apply({
        type: 'remove',
        amount: 15,
      })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, { armorClass: -5 })
    })

    it('Should set a new base', async () => {
      const component = await mountWithTooltips(Ac, {
        props: { item: { ...item, maxArmorClassOld: 18 } },
        provide,
      })

      await (component.vm as unknown as AcTestMethods).apply({
        type: 'base',
        amount: 16,
      })

      expect(mockPatchRow).toHaveBeenCalledWith(item.id, {
        armorClass: 16,
        maxArmorClass: 16,
        maxArmorClassOld: null,
      })
    })

    it('Should not patch without a sheet', async () => {
      mockSheet.value = undefined as never

      const component = await mountWithTooltips(Ac, {
        props: { item },
        provide,
      })

      await (component.vm as unknown as AcTestMethods).apply({
        type: 'add',
        amount: 1,
      })

      expect(mockPatchRow).not.toHaveBeenCalled()
    })
  })

  describe('Popover content', () => {
    it('Should render the current, max and temp AC breakdown when opened', async () => {
      const component = await mountWithTooltips(Ac, {
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
      const component = await mountWithTooltips(Ac, {
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
      const component = await mountWithTooltips(Ac, {
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
