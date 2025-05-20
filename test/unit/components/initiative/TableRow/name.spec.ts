import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Name from '~/components/initiative/TableRow/Name.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

type MockFunctions = {
  handleSubmit: (
    form: { name: string },
    node: { clearErrors: () => void, setErrors: (error: string) => void }
  ) => Promise<void>
}

const mockUpdate = vi.fn()

const mockNode = {
  clearErrors: vi.fn(),
  setErrors: vi.fn(),
}

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row name', async () => {
  beforeEach(() => mockUpdate.mockClear())

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Name, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display name and summoner if available', async () => {
    const component = await mountSuspended(Name, {
      props: {
        ...props,
        item: {
          ...props.item,
          summoner: { name: 'Summoner', id: '123' },
        },
      },
    })

    expect(component.find('[data-test-name]').text()).toBe(props.item.name)
    expect(component.find('[data-test-summoner]').text()).toBe('general.summoner: Summoner')
  })

  it('Should not display summoner', async () => {
    const component = await mountSuspended(Name, { props })

    expect(component.find('[data-test-summoner]').exists()).toBeFalsy()
  })

  it('Should handle name update', async () => {
    const component = await mountSuspended(Name, { props })
    const newName = 'New Character Name'

    const vm = component.vm as unknown as MockFunctions
    await vm.handleSubmit({ name: newName }, mockNode)

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          ...props.item,
          name: newName,
        }),
      ]),
    })
  })

  it('Should handle update errors', async () => {
    const errorUpdate = vi.fn().mockRejectedValue(new Error('Update failed'))
    const component = await mountSuspended(Name, {
      props: {
        ...props,
        update: errorUpdate,
      },
    })

    const vm = component.vm as unknown as MockFunctions
    await vm.handleSubmit({ name: 'New Name' }, mockNode)

    expect(mockNode.clearErrors).toHaveBeenCalled()
    expect(mockNode.setErrors).toHaveBeenCalled()
  })

  it('Should not update if sheet is undefined', async () => {
    const component = await mountSuspended(Name, {
      props: {
        ...props,
        sheet: undefined,
      },
    })

    const vm = component.vm as unknown as MockFunctions
    await vm.handleSubmit({ name: 'New Name' }, mockNode)

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
