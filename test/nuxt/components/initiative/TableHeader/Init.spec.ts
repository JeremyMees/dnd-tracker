import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Init from '~/components/initiative/TableHeader/Init.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface SelectedCreature {
  id: string
  amount?: number
  initiative?: number
}

interface InitFormValues {
  selectedTypes: string[]
  ignore: boolean
  selectedCreatures: SelectedCreature[]
}

interface InitVM {
  popoverOpen: boolean
  formError: string
  usedTypes: string[]
  rollAllInitiatives: () => void
  onSubmit: () => Promise<void>
  form: {
    values: InitFormValues
    setValues: (values: InitFormValues) => void
    setFieldValue: (field: string, value: unknown) => void
  }
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
    activeRow: mockActiveRow,
  },
}

const props = {
  label: 'Init',
}

describe('Initiative TableHeader Init', () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Init, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct initial values', async () => {
    const component = await mountSuspended(Init, { props, provide })
    const vm = component.vm as unknown as InitVM

    expect(vm.formError).toBe('')
    expect(vm.popoverOpen).toBeFalsy()
  })

  describe('usedTypes computed', () => {
    it('Should return unique types from sheet rows', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toContain('player')
      expect(vm.usedTypes).toContain('npc')
    })

    it('Should return unique types without duplicates', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, type: 'player' },
          { ...sheet.rows[1]!, type: 'player' },
          { ...sheet.rows[2]!, type: 'npc' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(2)
      expect(vm.usedTypes).toContain('player')
      expect(vm.usedTypes).toContain('npc')
    })

    it('Should return empty array when no rows', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(0)
    })

    it('Should handle monster type rows', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, type: 'monster' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toContain('monster')
    })

    it('Should handle multiple different types', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, type: 'player' },
          { ...sheet.rows[1]!, type: 'npc' },
          { ...sheet.rows[2]!, type: 'monster' },
          { ...sheet.rows[0]!, id: 'unique-1', type: 'lair' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(vm.usedTypes).toHaveLength(4)
    })
  })

  describe('Form methods', () => {
    it('Should have rollAllInitiatives callable', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(typeof vm.rollAllInitiatives).toBe('function')
    })

    it('Should have onSubmit callable', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      expect(typeof vm.onSubmit).toBe('function')
    })

    it('Should not call update when sheet is undefined', async () => {
      mockSheet.value = undefined

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM
      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Popover open watcher', () => {
    it('Should populate form values from sheet rows when opened', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          {
            ...sheet.rows[0]!,
            id: 'row1',
            initiative: 15,
            initiativeModifier: 2,
          },
          {
            ...sheet.rows[1]!,
            id: 'row2',
            initiative: -1,
            initiativeModifier: -1,
          },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      expect(vm.form.values.selectedCreatures).toEqual([
        { id: 'row1', amount: 15, initiative: 2 },
        { id: 'row2', amount: undefined, initiative: -1 },
      ])
      expect(vm.form.values.selectedTypes).toEqual(vm.usedTypes)
    })

    it('Should not populate form values when closed', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = false
      await nextTick()

      expect(vm.form.values.selectedCreatures).toEqual([])
    })

    it('Should not repopulate form values when transitioning from open to closed', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()
      const populated = vm.form.values.selectedCreatures

      vm.popoverOpen = false
      await nextTick()

      expect(vm.form.values.selectedCreatures).toEqual(populated)
    })

    it('Should handle the sheet being undefined while opened', async () => {
      mockSheet.value = undefined

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      expect(vm.form.values.selectedCreatures).toEqual([])
      expect(
        document.body.querySelector('[test-id="popover-content"]'),
      ).toBeTruthy()
    })

    it('Should render the popover content with a field per row when opened', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1', name: 'Row One' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      expect(document.body.querySelector('#row1')).toBeTruthy()
      expect(document.body.querySelector('#row1-mod')).toBeTruthy()
      expect(document.body.textContent).toContain('Row One')
    })
  })

  describe('rollAllInitiatives', () => {
    it('Should set a random amount for rows of a selected type', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, id: 'row1', type: 'player' },
          { ...sheet.rows[1]!, id: 'row2', type: 'npc' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setFieldValue('selectedTypes', ['player'])
      vm.rollAllInitiatives()

      const amount = vm.form.values.selectedCreatures[0]?.amount
      expect(amount).toBeGreaterThanOrEqual(1)
      expect(amount).toBeLessThanOrEqual(20)
    })

    it('Should not set an amount for rows of a type that is not selected', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, id: 'row1', type: 'player' },
          { ...sheet.rows[1]!, id: 'row2', type: 'npc' },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setFieldValue('selectedTypes', ['player'])
      vm.rollAllInitiatives()

      expect(vm.form.values.selectedCreatures[1]?.amount).toBeUndefined()
    })

    it('Should not set an amount when no types are selected', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1', type: 'player' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.rollAllInitiatives()

      expect(vm.form.values.selectedCreatures[0]?.amount).toBeUndefined()
    })
  })

  describe('onSubmit calculations', () => {
    it('Should add the initiative modifier to the amount when not ignored', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: 'row1', initiative: 13 }),
        ]),
      })
      expect(vm.popoverOpen).toBeFalsy()
    })

    it('Should ignore the initiative modifier when ignore is true', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: true,
        selectedCreatures: [{ id: 'row1', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: 'row1', initiative: 10 }),
        ]),
      })
    })

    it('Should not go below 0 when the modifier is negative', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', amount: 2, initiative: -10 }],
      })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: 'row1', initiative: 0 }),
        ]),
      })
    })

    it('Should skip rows without an amount', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1', initiative: 5 }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', initiative: 3 }],
      })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: 'row1', initiative: 5 }),
        ]),
      })
    })

    it('Should skip creature entries that are not found in the sheet rows', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1', initiative: 5 }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'not-in-sheet', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalledWith({
        rows: expect.arrayContaining([
          expect.objectContaining({ id: 'row1', initiative: 5 }),
        ]),
      })
    })

    it('Should set formError when update throws', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('roll failed'))
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()

      expect(vm.formError).toBe('roll failed')
    })

    it('Should set a fallback formError when update throws without a message', async () => {
      mockUpdate.mockRejectedValueOnce({})
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()

      expect(vm.formError).toBe(
        'An error occurred during quick initiative roll',
      )
    })

    it('Should render the form error message in the popover when set', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('boom'))
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      vm.form.setValues({
        selectedTypes: [],
        ignore: false,
        selectedCreatures: [{ id: 'row1', amount: 10, initiative: 3 }],
      })
      await vm.onSubmit()
      await nextTick()

      expect(document.body.textContent).toContain('boom')
    })
  })

  describe('Roll button interaction', () => {
    it('Should set a random amount when clicking a row roll button', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, id: 'row1', name: 'Row One' }],
      }

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      const rollButton = document.body.querySelector(
        'button[aria-label="actions.roll"]',
      ) as HTMLButtonElement
      rollButton.click()
      await nextTick()

      const amount = vm.form.values.selectedCreatures[0]?.amount
      expect(amount).toBeGreaterThanOrEqual(1)
      expect(amount).toBeLessThanOrEqual(20)
    })
  })

  describe('Initiative values handling', () => {
    it('Should handle rows with initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          { ...sheet.rows[0]!, initiative: 15, initiativeModifier: 2 },
          { ...sheet.rows[1]!, initiative: 10, initiativeModifier: -1 },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })

    it('Should handle rows with undefined initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [
          {
            ...sheet.rows[0]!,
            initiative: undefined as unknown as number,
            initiativeModifier: undefined as unknown as number,
          },
        ],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })

    it('Should handle rows with negative initiative values', async () => {
      mockSheet.value = {
        ...sheet,
        rows: [{ ...sheet.rows[0]!, initiative: -1, initiativeModifier: -5 }],
      }

      const component = await mountSuspended(Init, { props, provide })

      expect(component.html()).toBeTruthy()
    })
  })
})
