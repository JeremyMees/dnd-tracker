import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Name from '~/components/initiative/TableRow/Name.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

type MockFunctions = {
  onSubmit: (e?: Event) => Promise<void>
  popoverOpen: boolean
  formError: string
  form: { setValues: (values: { name: string }) => void }
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
  },
}

const props: Props = {
  item: sheet.rows[0]!,
}

describe('Initiative table row name', async () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Name, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display name and summoner if available', async () => {
    const component = await mountSuspended(Name, {
      props: {
        item: {
          ...props.item,
          summoner: { name: 'Summoner', id: '123' },
        },
      },
      provide,
    })

    expect(component.find('[test-id="name"]').text()).toBe(props.item.name)
    expect(component.find('[test-id="summoner"]').text()).toBe(
      'general.summoner: Summoner',
    )
  })

  it('Should not display summoner', async () => {
    const component = await mountSuspended(Name, { props, provide })

    expect(component.find('[test-id="summoner"]').exists()).toBeFalsy()
  })

  it('Should not update if sheet is undefined', async () => {
    mockSheet.value = undefined

    const component = await mountSuspended(Name, {
      props,
      provide,
    })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should not update if the row is not found in the sheet', async () => {
    const component = await mountSuspended(Name, {
      props: {
        item: { ...props.item, id: 'not-in-sheet' },
      },
      provide,
    })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should update the row name and close the popover on successful submit', async () => {
    const component = await mountSuspended(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.popoverOpen = true
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          id: props.item.id,
          name: 'New Name',
        }),
      ]),
    })
    expect(vm.popoverOpen).toBeFalsy()
  })

  it('Should set formError when update throws', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Update failed'))

    const component = await mountSuspended(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(vm.formError).toBe('Update failed')
  })

  it('Should set a fallback formError when update throws without a message', async () => {
    mockUpdate.mockRejectedValueOnce({})

    const component = await mountSuspended(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.form.setValues({ name: 'New Name' })
    await vm.onSubmit()

    expect(vm.formError).toBe('An error occurred during name update')
  })

  it('Should render the rename popover content when opened', async () => {
    const component = await mountSuspended(Name, { props, provide })

    const vm = component.vm as unknown as MockFunctions
    vm.popoverOpen = true
    await nextTick()

    expect(document.body.textContent).toContain(
      'components.initiativeTableModals.name',
    )
    expect(document.body.querySelector('input[type="text"]')).toBeTruthy()
    expect(
      document.body.querySelector('button[aria-label="actions.save"]'),
    ).toBeTruthy()
  })
})
