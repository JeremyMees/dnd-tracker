import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Conditions from '~/components/initiative/TableRow/Conditions.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import Button from '~/components/ui/button/Button.vue'
import NumberField from '~/components/ui/number-field/NumberField.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import conditions from '~~/test/fixtures/conditions.json'

interface Props {
  item: InitiativeSheetRow
}

type Condition = InitiativeSheetRow['conditions'][0]

interface ConditionsVM {
  selected: Condition[]
  popoverOpen: boolean
  removeCondition: (name: string) => void
  updateCondition: (conditions: Condition[]) => void
  toggleSelected: (item: Condition) => void
}

const mockPatchRow = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    patchRow: mockPatchRow,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

vi.mock('~/queries/open5e', () => ({
  useConditionsListing: () => ({
    data: ref(conditions),
    isPending: ref(false),
  }),
  useOpen5eDocuments: () => ({
    data: ref([]),
  }),
}))

describe('Initiative table row conditions', async () => {
  beforeEach(() => {
    mockPatchRow.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Conditions, { props, provide })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type items', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        item: { ...props.item, type: 'lair' },
      },
      provide,
    })

    expect(component.find('div').exists()).toBeFalsy()
  })

  it('Should always show add condition button', async () => {
    const component = await mountSuspended(Conditions, { props, provide })

    expect(component.find('[test-id="trigger"]').exists()).toBeTruthy()
  })

  it('Should show selected conditions', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        item: {
          ...props.item,
          conditions: [conditions[0] as Condition, conditions[1] as Condition],
        },
      },
      provide,
    })

    expect(component.find('[test-id="conditions"]').exists()).toBeTruthy()

    const badges = component.findAll('[test-id="badge"]')

    expect(badges.length).toBe(2)
    expect(badges[0]!.text()).toBe(conditions[0]!.name)
    expect(badges[1]!.text()).toBe(conditions[1]!.name)
  })

  it('Should not show conditions when no conditions are selected', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        item: {
          ...props.item,
          conditions: [],
        },
      },
      provide,
    })

    expect(component.find('[test-id="conditions"]').exists()).toBeFalsy()
  })

  it('Should display the level of the condition if available', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        item: {
          ...props.item,
          conditions: [
            {
              ...(conditions[0] as Condition),
              level: 2,
            },
          ],
        },
      },
      provide,
    })

    expect(component.find('[test-id="badge"]').text()).toBe(
      `${conditions[0]!.name} (2)`,
    )
  })

  describe('removeCondition', () => {
    it('Should patch the row with the matching condition removed', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.removeCondition('Paralyzed')

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: props.item.conditions.filter(c => c.name !== 'Paralyzed'),
      })
    })

    it('Should leave conditions unchanged when the name does not match', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.removeCondition('Unknown condition')

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: props.item.conditions,
      })
    })

    it('Should remove a condition through the remove button in the popover', async () => {
      const component = await mountSuspended(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      const removeButton = component
        .findAllComponents(Button)
        .find(button => button.attributes('test-id') === 'remove')

      await removeButton!.trigger('click')

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [],
      })
    })
  })

  describe('updateCondition', () => {
    it('Should patch the row with the new conditions and close the popover', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      vm.updateCondition([conditions[2] as Condition])

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [conditions[2]],
      })
      expect(vm.popoverOpen).toBeFalsy()
    })
  })

  describe('Add condition trigger', () => {
    it('Should open the popover when the trigger button is clicked', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      await component.get('[test-id="trigger"]').trigger('click')

      expect(vm.popoverOpen).toBeTruthy()
    })
  })

  describe('toggleSelected', () => {
    it('Should add a condition to selected when not already present', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.toggleSelected(conditions[0] as Condition)

      expect(vm.selected.map(c => c.id)).toEqual([conditions[0]!.id])
    })

    it('Should remove a condition from selected when toggled again', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.toggleSelected(conditions[0] as Condition)
      vm.toggleSelected(conditions[0] as Condition)

      expect(vm.selected).toHaveLength(0)
    })
  })

  describe('popoverOpen watcher', () => {
    it('Should populate selected with the item conditions when the popover opens', async () => {
      const component = await mountSuspended(Conditions, {
        props: {
          item: {
            ...props.item,
            conditions: [
              conditions[0] as Condition,
              conditions[1] as Condition,
            ],
          },
        },
        provide,
      })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      expect(vm.selected.map(c => c.id)).toEqual([
        conditions[0]!.id,
        conditions[1]!.id,
      ])
    })

    it('Should clear selected when the popover closes', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()
      vm.popoverOpen = false
      await nextTick()

      expect(vm.selected).toHaveLength(0)
    })
  })

  describe('Add condition popover', () => {
    it('Should render an option for every available condition', async () => {
      const component = await mountSuspended(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      const options = component
        .findAllComponents(Badge)
        .filter(badge => badge.attributes('test-id') === 'option')

      expect(options).toHaveLength(conditions.length)
    })

    it('Should select and update a condition through the popover UI', async () => {
      const component = await mountSuspended(Conditions, {
        props: { item: { ...props.item, conditions: [] } },
        provide,
      })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      const option = component
        .findAllComponents(Badge)
        .find(badge => badge.text() === conditions[0]!.name)

      await option!.trigger('click')

      const updateButton = component
        .findAllComponents(Button)
        .find(button => button.attributes('test-id') === 'update')

      await updateButton!.trigger('click')

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(
        props.item.id,
        expect.objectContaining({
          conditions: expect.arrayContaining([
            expect.objectContaining({ id: conditions[0]!.id }),
          ]),
        }),
      )
      expect(vm.popoverOpen).toBeFalsy()
    })

    it('Should deselect a condition when its option is clicked twice', async () => {
      const component = await mountSuspended(Conditions, {
        props: {
          item: { ...props.item, conditions: [conditions[0] as Condition] },
        },
        provide,
      })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      const option = component
        .findAllComponents(Badge)
        .find(badge => badge.text() === conditions[0]!.name)

      await option!.trigger('click')

      expect(vm.selected).toHaveLength(0)
    })
  })

  describe('Existing condition popover', () => {
    it('Should show the condition title, description and remove button when opened', async () => {
      const component = await mountSuspended(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      expect(component.text()).toContain(props.item.conditions[0]!.name)
      expect(component.findComponent(NumberField).exists()).toBeFalsy()

      const removeButton = component
        .findAllComponents(Button)
        .find(button => button.attributes('test-id') === 'remove')

      expect(removeButton).toBeTruthy()
    })

    it('Should remove the condition when the remove button is clicked', async () => {
      const component = await mountSuspended(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      const removeButton = component
        .findAllComponents(Button)
        .find(button => button.attributes('test-id') === 'remove')

      await removeButton!.trigger('click')

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [],
      })
    })
  })

  describe('Condition with levels', () => {
    const levelCondition: Condition = {
      id: 'custom_exhaustion',
      name: 'Exhaustion',
      desc: 'Exhaustion description',
      hasLevels: true,
      level: 2,
    }

    it('Should show the number field when the condition has levels', async () => {
      const component = await mountSuspended(Conditions, {
        props: { item: { ...props.item, conditions: [levelCondition] } },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      expect(component.findComponent(NumberField).exists()).toBeTruthy()
    })

    it('Should not show the number field when the condition has no levels', async () => {
      const component = await mountSuspended(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      expect(component.findComponent(NumberField).exists()).toBeFalsy()
    })

    it('Should default the level to 1 when not provided', async () => {
      const component = await mountSuspended(Conditions, {
        props: {
          item: {
            ...props.item,
            conditions: [{ ...levelCondition, level: undefined }],
          },
        },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      expect(component.findComponent(NumberField).props('defaultValue')).toBe(1)
    })

    it('Should update the condition level when the number field value changes', async () => {
      const otherCondition = conditions[0] as Condition
      const component = await mountSuspended(Conditions, {
        props: {
          item: { ...props.item, conditions: [levelCondition, otherCondition] },
        },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      const numberField = component.findComponent(NumberField)
      await numberField.vm.$emit('update:modelValue', 4)

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [{ ...levelCondition, level: 4 }, otherCondition],
      })
    })
  })
})
