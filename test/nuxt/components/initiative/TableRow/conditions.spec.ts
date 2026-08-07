import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Conditions from '~/components/initiative/TableRow/Conditions.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import conditions from '~~/test/fixtures/conditions.json'

interface Props {
  item: InitiativeSheetRow
}

type Condition = InitiativeSheetRow['conditions'][0]

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
    mockUpdate.mockClear()
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
})
