import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Name from '~/components/initiative/TableRow/Name.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
}

type MockFunctions = {
  onSubmit: (form: { name: string }) => Promise<void>
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
    await vm.onSubmit({ name: 'New Name' })

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
