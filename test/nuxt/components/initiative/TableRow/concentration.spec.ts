import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Concentration from '~/components/initiative/TableRow/Concentration.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'

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

describe('Initiative table row concentration', async () => {
  beforeEach(() => {
    mockPatchRow.mockClear()
    mockSheet.value = sheet
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Concentration, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render button for lair type', async () => {
    const component = await mountSuspended(Concentration, {
      props: {
        item: { ...props.item, type: 'lair' as const },
      },
      provide,
    })

    expect(component.find('button').exists()).toBeFalsy()
  })

  it('Should render button for non-lair type', async () => {
    const component = await mountSuspended(Concentration, { props, provide })

    expect(component.find('button').exists()).toBeTruthy()
  })

  it('Should show filled circle when concentration is true', async () => {
    const component = await mountSuspended(Concentration, { props, provide })

    expect(component.find('[test-id="true"]').exists()).toBeTruthy()
  })

  it('Should show dotted circle when concentration is false', async () => {
    const component = await mountSuspended(Concentration, {
      props: {
        item: { ...props.item, concentration: false },
      },
      provide,
    })

    expect(component.find('[test-id="false"]').exists()).toBeTruthy()
  })

  it('Should call patchRow with toggled concentration', async () => {
    const component = await mountSuspended(Concentration, { props, provide })

    await component.find('button').trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith(props.item.id, {
      concentration: !props.item.concentration,
    })
  })
})
