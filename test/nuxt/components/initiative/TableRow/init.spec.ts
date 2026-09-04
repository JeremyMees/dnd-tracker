import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Init from '~/components/initiative/TableRow/Init.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

interface InitVM {
  popoverOpen: boolean
  formError: string
  moveRow: (up: boolean) => Promise<void>
  onSubmit: () => Promise<void>
  form: {
    values: { initiative?: number }
    setValues: (values: {
      initiative: number
      modifier?: number | null
    }) => void
  }
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

describe('Initiative table row init', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Init, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should open the popover when the trigger is clicked', async () => {
    const component = await mountSuspended(Init, { props, provide })
    const vm = component.vm as unknown as { popoverOpen: boolean }

    await component.get('[test-id="trigger"]').trigger('click')

    expect(vm.popoverOpen).toBe(true)
  })

  it('Should display initiative value correctly', async () => {
    const initiative = 15
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative },
      },
      provide,
    })

    expect(component.get('[test-id="initiative"]').text()).toBe(
      initiative.toString(),
    )
  })

  it('Should show plus icon when initiative is not defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: -1 },
      },
      provide,
    })

    expect(component.get('[test-id="empty"]').isVisible()).toBeTruthy()
  })

  it('Should show up/down controls when initiative is defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15 },
      },
      provide,
    })

    expect(component.get('[test-id="controls"]').isVisible()).toBeTruthy()
  })

  it('Should not show controls when initiative is not defined', async () => {
    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: -1 },
      },
      provide,
    })

    expect(component.find('[test-id="controls"]').exists()).toBeFalsy()
  })

  it('Should enable up button when can move up', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...sheet.rows[0]!, initiative: 15, index: 0 },
        { ...props.item, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 1 },
      },
      provide,
    })

    expect(component.get('[test-id="up"]').isVisible()).toBeTruthy()
  })

  it('Should enable down button when can move down', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...props.item, initiative: 15, index: 0 },
        { ...sheet.rows[0]!, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 0 },
      },
      provide,
    })

    expect(component.get('[test-id="down"]').isVisible()).toBeTruthy()
  })

  it('Should move row up when clicking up button', async () => {
    const firstRow = { ...sheet.rows[0]!, initiative: 15, index: 0, id: 'row1' }
    const secondRow = { ...props.item, initiative: 15, index: 1, id: 'row2' }

    mockSheet.value = {
      ...sheet,
      rows: [firstRow, secondRow],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: secondRow,
      },
      provide,
    })

    await component.get('[test-id="up"]').trigger('click')

    expect(mockUpdate).toHaveBeenCalled()

    const payload = mockUpdate.mock.calls[0]?.[0] as {
      rows: InitiativeSheetRow[]
    }
    expect(payload).toBeDefined()

    const resultRows = payload.rows
    expect(resultRows[0]?.id).toBe('row2')
    expect(resultRows[1]?.id).toBe('row1')
  })

  it('Should move row down when clicking down button', async () => {
    const firstRow = { ...props.item, initiative: 15, index: 0, id: 'row1' }
    const secondRow = {
      ...sheet.rows[0]!,
      initiative: 15,
      index: 1,
      id: 'row2',
    }

    mockSheet.value = {
      ...sheet,
      rows: [firstRow, secondRow],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: firstRow,
      },
      provide,
    })

    await component.get('[test-id="down"]').trigger('click')

    expect(mockUpdate).toHaveBeenCalled()

    const payload = mockUpdate.mock.calls[0]?.[0] as {
      rows: InitiativeSheetRow[]
    }
    expect(payload).toBeDefined()

    const resultRows = payload.rows
    expect(resultRows[0]?.id).toBe('row2')
    expect(resultRows[1]?.id).toBe('row1')
  })

  it('Should not show up/down buttons when initiative values are different', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [
        { ...sheet.rows[0]!, initiative: 20, index: 0 },
        { ...props.item, initiative: 15, index: 1 },
      ],
    }

    const component = await mountSuspended(Init, {
      props: {
        item: { ...props.item, initiative: 15, index: 1 },
      },
      provide,
    })

    expect(component.find('[test-id="up"]').exists()).toBeFalsy()
    expect(component.find('[test-id="down"]').exists()).toBeFalsy()
  })

  it('Should update all following indexes when moving a row up past multiple rows', async () => {
    const firstRow = { ...sheet.rows[0]!, initiative: 15, index: 0, id: 'row1' }
    const secondRow = {
      ...sheet.rows[1]!,
      initiative: 15,
      index: 1,
      id: 'row2',
    }
    const thirdRow = { ...props.item, initiative: 15, index: 2, id: 'row3' }
    const fourthRow = {
      ...sheet.rows[0]!,
      initiative: 15,
      index: 3,
      id: 'row4',
    }

    mockSheet.value = {
      ...sheet,
      rows: [firstRow, secondRow, thirdRow, fourthRow],
    }

    const component = await mountSuspended(Init, {
      props: { item: thirdRow },
      provide,
    })
    const vm = component.vm as unknown as InitVM

    await vm.moveRow(true)

    expect(mockUpdate).toHaveBeenCalled()
    const payload = mockUpdate.mock.calls[0]?.[0] as {
      rows: InitiativeSheetRow[]
    }
    const resultRows = payload.rows
    expect(resultRows.map(row => row.id)).toEqual([
      'row1',
      'row3',
      'row2',
      'row4',
    ])
    expect(resultRows.map(row => row.index)).toEqual([0, 1, 2, 3])
  })

  it('Should not move the row when already at the top', async () => {
    const component = await mountSuspended(Init, {
      props: { item: { ...props.item, index: 0 } },
      provide,
    })
    const vm = component.vm as unknown as InitVM

    await vm.moveRow(true)

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should not move the row when already at the bottom', async () => {
    const component = await mountSuspended(Init, {
      props: { item: { ...props.item, index: sheet.rows.length - 1 } },
      provide,
    })
    const vm = component.vm as unknown as InitVM

    await vm.moveRow(false)

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  describe('Form submission', () => {
    it('Should save the combined initiative and modifier on submit', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      vm.form.setValues({ initiative: 12, modifier: 3 })
      await vm.onSubmit()

      expect(mockUpdate).toHaveBeenCalled()
      const payload = mockUpdate.mock.calls[0]?.[0] as {
        rows: InitiativeSheetRow[]
      }
      const resultRow = payload.rows.find(row => row.id === props.item.id)
      expect(resultRow?.initiative).toBe(15)
      expect(vm.popoverOpen).toBe(false)
    })

    it('Should not go below 0 when the modifier is negative', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      vm.form.setValues({ initiative: 2, modifier: -10 })
      await vm.onSubmit()

      const payload = mockUpdate.mock.calls[0]?.[0] as {
        rows: InitiativeSheetRow[]
      }
      const resultRow = payload.rows.find(row => row.id === props.item.id)
      expect(resultRow?.initiative).toBe(0)
    })

    it('Should not call update when sheet is undefined', async () => {
      mockSheet.value = undefined as unknown as InitiativeSheet

      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.form.setValues({ initiative: 10 })
      await vm.onSubmit()

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('Should roll a random initiative when the roll button is clicked', async () => {
      const component = await mountSuspended(Init, { props, provide })
      const vm = component.vm as unknown as InitVM

      vm.popoverOpen = true
      await nextTick()

      const rollButton = document.body.querySelector(
        'button[aria-label="actions.roll"]',
      ) as HTMLButtonElement
      rollButton.click()
      await nextTick()

      expect(vm.form.values.initiative).toBeGreaterThanOrEqual(1)
      expect(vm.form.values.initiative).toBeLessThanOrEqual(20)
    })
  })
})
