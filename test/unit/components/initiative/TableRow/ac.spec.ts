import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Ac from '~/components/initiative/TableRow/Ac.vue'
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

describe('Initiative table row ac', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Ac, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display AC values correctly', async () => {
    const ac = 1
    const maxAc = 15
    const maxAcOld = 10
    const tempAc = 5

    const component = await mountSuspended(Ac, {
      props: {
        ...props,
        item: { ...props.item, ac, maxAc, maxAcOld, tempAc },
      },
    })

    expect(component.get('[data-test-ac]').text()).toBe(ac.toString())
    expect(component.get('[data-test-max]').text()).toContain(maxAc.toString())
    expect(component.get('[data-test-temp]').text()).toContain(tempAc.toString())
  })

  it('Should show destructive styling when AC is 0', async () => {
    const component = await mountSuspended(Ac, {
      props: {
        ...props,
        item: { ...props.item, ac: 0 },
      },
    })

    expect(component.get('[data-test-trigger]').classes()).toContain('bg-destructive/20')
    expect(component.get('[data-test-ac]').classes()).toContain('text-destructive')
  })

  it('Should show plus icon when AC is not defined', async () => {
    const component = await mountSuspended(Ac, {
      props: {
        ...props,
        item: { ...props.item, ac: undefined },
      },
    })

    expect(component.get('[data-test-empty]').isVisible()).toBeTruthy()
  })
})
