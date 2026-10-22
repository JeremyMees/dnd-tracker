import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Conditions from '~/components/initiative/TableRow/Conditions.vue'
import { useRowShortcut } from '~/composables/useRowShortcut'
import Badge from '~/components/ui/badge/Badge.vue'
import Button from '~/components/ui/button/Button.vue'
import NumberField from '~/components/ui/number-field/NumberField.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import conditions from '~~/test/fixtures/conditions.json'
import { isHidden } from '~~/test/nuxt/stubs/form'

interface Props {
  item: InitiativeSheetRow
}

type Condition = InitiativeSheetRow['conditions'][0]

interface ConditionsVM {
  popoverOpen: boolean
  removeCondition: (name: string) => void
  updateCondition: (conditions: Condition[]) => void
  addCondition: (condition: Condition) => void
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

vi.mock('~/queries/srd', () => ({
  useConditionsListing: () => ({
    data: ref(conditions),
    isPending: ref(false),
  }),
  useSrdDocuments: () => ({
    data: ref([]),
  }),
  useSrdListing: () => ({ data: ref(undefined) }),
}))

describe('Initiative table row conditions', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(Conditions, { props, provide })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type items', async () => {
    const component = await mountWithTooltips(Conditions, {
      props: {
        item: { ...props.item, type: 'lair' },
      },
      provide,
    })

    expect(component.find('div').exists()).toBeFalsy()
  })

  it('Should always show add condition button', async () => {
    const component = await mountWithTooltips(Conditions, { props, provide })

    expect(component.find('[test-id="trigger"]').exists()).toBeTruthy()
  })

  it('Should label the add condition button', async () => {
    const component = await mountWithTooltips(Conditions, { props, provide })

    expect(component.get('[test-id="trigger"]').attributes('aria-label')).toBe(
      'pages.encounter.update.conditions',
    )
  })

  it('Should show selected conditions', async () => {
    const component = await mountWithTooltips(Conditions, {
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
    const component = await mountWithTooltips(Conditions, {
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
    const component = await mountWithTooltips(Conditions, {
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

  describe('Durations', () => {
    const timed: Condition = {
      ...(conditions[0] as Condition),
      duration: { rowId: sheet.rows[1]!.id, timing: 'end', rounds: 2 },
    }
    const saveEnds: Condition = {
      ...(conditions[1] as Condition),
      duration: {
        rowId: sheet.rows[0]!.id,
        timing: 'end',
        save: { ability: 'wisdom', dc: 13 },
      },
    }

    function mountWith(conditionList: Condition[]) {
      return mountWithTooltips(Conditions, {
        props: { item: { ...props.item, conditions: conditionList } },
        provide,
      })
    }

    it('Should show the rounds left on the badge', async () => {
      const component = await mountWith([timed])

      const duration = component.get('[test-id="duration"]')

      expect(duration.text()).toContain('2')
    })

    it('Should mark a save-only duration without a round count', async () => {
      const component = await mountWith([saveEnds])

      expect(component.get('[test-id="duration"]').text()).not.toMatch(/\d/)
    })

    it('Should not mark conditions without a duration', async () => {
      const component = await mountWith([conditions[0] as Condition])

      expect(component.find('[test-id="duration"]').exists()).toBe(false)
    })

    it('Should describe the duration in the condition popover', async () => {
      const component = await mountWith([
        {
          ...timed,
          duration: { ...timed.duration!, save: saveEnds.duration!.save },
        },
      ])

      await component.findComponent(Badge).trigger('click')

      expect(
        document.body.querySelector('[test-id="duration-rounds"]')?.textContent,
      ).toContain('components.conditionDuration.summary.end')
      expect(
        document.body.querySelector('[test-id="duration-save"]')?.textContent,
      ).toContain('components.conditionDuration.summary.save.end')
    })

    function bodyEl(testId: string): HTMLElement {
      return document.body.querySelector(`[test-id="${testId}"]`)!
    }

    it('Should hide the duration editor until the toggle is pressed', async () => {
      const component = await mountWith([timed])

      await component.findComponent(Badge).trigger('click')

      expect(isHidden(bodyEl('duration-editor'))).toBe(true)
      expect(bodyEl('duration-toggle').getAttribute('aria-expanded')).toBe(
        'false',
      )
      expect(bodyEl('duration-toggle').textContent).toContain(
        'components.conditionDuration.edit',
      )

      bodyEl('duration-toggle').click()
      await nextTick()

      expect(isHidden(bodyEl('duration-editor'))).toBe(false)
      expect(bodyEl('duration-toggle').getAttribute('aria-expanded')).toBe(
        'true',
      )
    })

    it('Should offer to add a duration when there is none', async () => {
      const component = await mountWith([conditions[0] as Condition])

      await component.findComponent(Badge).trigger('click')

      expect(bodyEl('duration-none').textContent).toContain(
        'components.conditionDuration.clear',
      )
      expect(bodyEl('duration-toggle').textContent).toContain(
        'components.conditionDuration.add',
      )
    })

    it('Should close the duration editor once a duration is chosen', async () => {
      const component = await mountWith([timed])

      await component.findComponent(Badge).trigger('click')
      bodyEl('duration-toggle').click()
      await nextTick()

      await component
        .findComponent({ name: 'FormConditionDuration' })
        .vm.$emit('update', null)

      expect(isHidden(bodyEl('duration-editor'))).toBe(true)
    })

    it('Should patch only the conditions when a duration is set', async () => {
      const component = await mountWith([
        conditions[0] as Condition,
        conditions[1] as Condition,
      ])

      await component.findComponent(Badge).trigger('click')
      await component
        .findComponent({ name: 'FormConditionDuration' })
        .vm.$emit('update', timed.duration)

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [timed, conditions[1]],
      })
    })

    it('Should clear the duration', async () => {
      const component = await mountWith([timed])

      await component.findComponent(Badge).trigger('click')
      await component
        .findComponent({ name: 'FormConditionDuration' })
        .vm.$emit('update', null)

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [{ ...timed, duration: null }],
      })
    })

    it('Should keep a duration when another condition is added', async () => {
      const component = await mountWith([timed])
      const vm = component.vm as unknown as ConditionsVM

      vm.addCondition(conditions[1] as Condition)

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [timed, conditions[1]],
      })
    })
  })

  describe('removeCondition', () => {
    it('Should patch the row with the matching condition removed', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.removeCondition('Paralyzed')

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: props.item.conditions.filter(c => c.name !== 'Paralyzed'),
      })
    })

    it('Should leave conditions unchanged when the name does not match', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.removeCondition('Unknown condition')

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: props.item.conditions,
      })
    })

    it('Should remove a condition through the remove button in the popover', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })

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
    it('Should patch the row with the new conditions', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      vm.updateCondition([conditions[2] as Condition])

      expect(mockPatchRow).toHaveBeenCalledTimes(1)
      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [conditions[2]],
      })
    })
  })

  describe('Add condition trigger', () => {
    it('Should show the condition shortcut only on the target', async () => {
      const { targetId } = useRowShortcut()
      const component = await mountWithTooltips(Conditions, { props, provide })
      const tooltip = () =>
        component.get('[test-id="trigger"]').findComponent({ name: 'Tooltip' })

      expect(tooltip().props()).toMatchObject({
        shortcut: ['C'],
        disabled: false,
      })

      targetId.value = sheet.rows[1]!.id
      await nextTick()

      expect(tooltip().props('disabled')).toBe(true)

      targetId.value = undefined
      component.unmount()
    })

    it('Should open the popover when the condition shortcut is used', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      useRowShortcut().trigger(props.item.id, 'damage')
      await nextTick()

      expect(vm.popoverOpen).toBeFalsy()

      useRowShortcut().trigger(props.item.id, 'condition')
      await nextTick()

      expect(vm.popoverOpen).toBeTruthy()

      useRowShortcut().request.value = undefined
      component.unmount()
    })

    it('Should open the popover when the trigger button is clicked', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })
      const vm = component.vm as unknown as ConditionsVM

      await component.get('[test-id="trigger"]').trigger('click')

      expect(vm.popoverOpen).toBeTruthy()
    })
  })

  describe('Add condition popover', () => {
    async function openPicker(item: InitiativeSheetRow = props.item) {
      const component = await mountWithTooltips(Conditions, {
        props: { item },
        provide,
      })
      const vm = component.vm as unknown as ConditionsVM

      vm.popoverOpen = true
      await nextTick()

      return component.findComponent({ name: 'ConditionPicker' })
    }

    it('Should pass the listing, applied conditions and turn order to the picker', async () => {
      const picker = await openPicker()

      expect(picker.props()).toMatchObject({
        conditions,
        applied: props.item.conditions,
        rows: sheet.rows,
        activeRowId: sheet.rows[sheet.activeIndex]!.id,
      })
    })

    it('Should append a picked condition to the row', async () => {
      const picker = await openPicker({ ...props.item, conditions: [] })
      const duration: DndConditionDuration = {
        rowId: props.item.id,
        timing: 'end',
        rounds: 1,
      }

      await picker.vm.$emit('add', { ...conditions[0], duration })

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [{ ...conditions[0], duration }],
      })
    })

    it('Should remove a condition the picker removes', async () => {
      const picker = await openPicker()

      await picker.vm.$emit('remove', props.item.conditions[0])

      expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
        conditions: [],
      })
    })
  })

  describe('Existing condition popover', () => {
    it('Should show the condition title, description and remove button when opened', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      expect(component.text()).toContain(props.item.conditions[0]!.name)
      expect(component.findComponent(NumberField).exists()).toBeFalsy()

      const removeButton = component
        .findAllComponents(Button)
        .find(button => button.attributes('test-id') === 'remove')

      expect(removeButton).toBeTruthy()
    })

    it('Should look up the description of a stored condition by id', async () => {
      const listed = conditions[0]!
      const item = {
        ...props.item,
        conditions: [{ id: listed.id, name: listed.name, desc: '' }],
      }

      const component = await mountWithTooltips(Conditions, {
        props: { item },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      expect(
        component.findComponent({ name: 'MarkdownText' }).props('text'),
      ).toBe(listed.desc)
    })

    it('Should fall back to the stored description of an unlisted condition', async () => {
      const item = {
        ...props.item,
        conditions: [{ id: 'retired', name: 'Retired', desc: 'Old text.' }],
      }

      const component = await mountWithTooltips(Conditions, {
        props: { item },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      expect(
        component.findComponent({ name: 'MarkdownText' }).props('text'),
      ).toBe('Old text.')
    })

    it('Should remove the condition when the remove button is clicked', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })

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
      const component = await mountWithTooltips(Conditions, {
        props: { item: { ...props.item, conditions: [levelCondition] } },
        provide,
      })

      await component.findComponent(Badge).trigger('click')

      expect(component.findComponent(NumberField).exists()).toBeTruthy()
    })

    it('Should not show the number field when the condition has no levels', async () => {
      const component = await mountWithTooltips(Conditions, { props, provide })

      await component.findComponent(Badge).trigger('click')

      expect(component.findComponent(NumberField).exists()).toBeFalsy()
    })

    it('Should default the level to 1 when not provided', async () => {
      const component = await mountWithTooltips(Conditions, {
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
      const component = await mountWithTooltips(Conditions, {
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
