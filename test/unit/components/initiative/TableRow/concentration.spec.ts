import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Concentration from '~/components/initiative/TableRow/Concentration.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}

const mockUpdate = vi.fn()

const props: Props = {
  item: sheet.rows[0]!,
  sheet,
  update: mockUpdate,
}

describe('Initiative table row concentration', async () => {
  beforeEach(() => mockUpdate.mockClear())

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Concentration, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render button for lair type', async () => {
    const component = await mountSuspended(Concentration, {
      props: {
        ...props,
        item: { ...props.item, type: 'lair' as const },
      },
    })

    expect(component.find('button').exists()).toBeFalsy()
  })

  it('Should render button for non-lair type', async () => {
    const component = await mountSuspended(Concentration, { props })

    expect(component.find('button').exists()).toBeTruthy()
  })

  it('Should show filled circle when concentration is true', async () => {
    const component = await mountSuspended(Concentration, { props })

    expect(component.find('[data-test-concentration="true"]').exists()).toBeTruthy()
  })

  it('Should show dotted circle when concentration is false', async () => {
    const component = await mountSuspended(Concentration, {
      props: {
        ...props,
        item: { ...props.item, concentration: false },
      },
    })

    expect(component.find('[data-test-concentration="false"]').exists()).toBeTruthy()
  })

  it('Should call update with toggled concentration', async () => {
    const component = await mountSuspended(Concentration, { props })

    await component.find('button').trigger('click')

    expect(mockUpdate).toHaveBeenCalledWith({
      rows: expect.arrayContaining([
        expect.objectContaining({
          concentration: !props.item.concentration,
        }),
      ]),
    })
  })

  it('Should not call update when sheet is undefined', async () => {
    const component = await mountSuspended(Concentration, {
      props: {
        ...props,
        sheet: undefined,
      },
    })

    await component.find('button').trigger('click')

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
