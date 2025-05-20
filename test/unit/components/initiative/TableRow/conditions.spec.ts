import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Conditions from '~/components/initiative/TableRow/Conditions.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'
import conditions from '~~/test/unit/fixtures/conditions.json'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

type Condition = InitiativeSheetRow['conditions'][0]

const mockUpdate = vi.fn()

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

// Mock the useConditionsListing composable
vi.mock('~~/queries/open5e', () => ({
  useConditionsListing: () => ({
    data: ref(conditions),
    isPending: ref(false),
  }),
}))

describe('Initiative table row conditions', async () => {
  beforeEach(() => mockUpdate.mockClear())

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Conditions, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render for lair type items', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        ...props,
        item: { ...props.item, type: 'lair' },
      },
    })

    expect(component.find('div').exists()).toBeFalsy()
  })

  it('Should always show add condition button', async () => {
    const component = await mountSuspended(Conditions, { props })

    expect(component.find('[data-test-trigger]').exists()).toBeTruthy()
  })

  it('Should show selected conditions', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        ...props,
        item: {
          ...props.item,
          conditions: [
            conditions[0] as Condition,
            conditions[1] as Condition,
          ],
        },
      },
    })

    expect(component.find('[data-test-conditions]').exists()).toBeTruthy()

    const badges = component.findAll('[data-test-badge]')

    expect(badges.length).toBe(2)
    expect(badges[0]!.text()).toBe(conditions[0]!.name)
    expect(badges[1]!.text()).toBe(conditions[1]!.name)
  })

  it('Should not show conditions when no conditions are selected', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        ...props,
        item: {
          ...props.item,
          conditions: [],
        },
      },
    })

    expect(component.find('[data-test-conditions]').exists()).toBeFalsy()
  })

  it('Should display the level of the condition if available', async () => {
    const component = await mountSuspended(Conditions, {
      props: {
        ...props,
        item: {
          ...props.item,
          conditions: [{
            ...conditions[0] as Condition,
            level: 2,
          }],
        },
      },
    })

    expect(component.find('[data-test-badge]').text()).toBe(`${conditions[0]!.name} (2)`)
  })
})
