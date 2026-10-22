import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import Concentration from '~/components/initiative/TableRow/Concentration.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface Props {
  item: InitiativeSheetRow
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

let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

async function mount(item: InitiativeSheetRow = props.item) {
  wrapper = await mountWithTooltips(Concentration, {
    props: { item },
    provide,
  })

  return wrapper
}

describe('Initiative table row concentration', async () => {
  beforeEach(() => {
    mockSheet.value = sheet
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should match snapshot', async () => {
    const component = await mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type', async () => {
    const component = await mount({ ...props.item, type: 'lair' })

    expect(component.find('[test-id="concentration"]').exists()).toBeFalsy()
  })

  it('Should fill the pip when concentrating', async () => {
    const component = await mount({ ...props.item, concentration: true })

    expect(component.get('[test-id="pip"]').attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('Should leave the pip empty when not concentrating', async () => {
    const component = await mount({ ...props.item, concentration: false })

    expect(component.get('[test-id="pip"]').attributes('aria-pressed')).toBe(
      'false',
    )
  })

  it('Should start concentrating when the empty pip is clicked', async () => {
    const component = await mount({ ...props.item, concentration: false })

    await component.get('[test-id="pip"]').trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      concentration: true,
    })
  })

  it('Should stop concentrating when the filled pip is clicked', async () => {
    const component = await mount({ ...props.item, concentration: true })

    await component.get('[test-id="pip"]').trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      concentration: false,
    })
  })
})
