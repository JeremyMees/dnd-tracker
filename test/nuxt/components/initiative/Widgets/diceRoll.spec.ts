import { toast } from '~~/test/nuxt/stubs/toast'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DiceRollWidget from '~/components/initiative/Widgets/DiceRoll.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const mockLog = vi.fn()

const provide = {
  [INITIATIVE_SHEET]: { sheet: ref(sheet), log: mockLog },
}

let component: VueWrapper

async function mountWidget() {
  component = await mountWithTooltips(DiceRollWidget, { provide })

  return component
}

describe('Initiative dice roll widget', async () => {
  afterEach(() => {
    component?.unmount()
    mockLog.mockReset()
    toast.mockClear()
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    await mountWidget()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the DiceRoller component', async () => {
    await mountWidget()

    expect(
      component.findComponent({ name: 'DiceRoller' }).exists(),
    ).toBeTruthy()
  })

  it('Should pass styled false to DiceRoller', async () => {
    await mountWidget()
    const inner = component.findComponent({ name: 'DiceRoller' })

    expect(inner.props('styled')).toBe(false)
  })

  it('Should render the Card with id tour-2', async () => {
    await mountWidget()

    expect(component.find('#tour-2').exists()).toBeTruthy()
  })

  it('Should render the Card with secondary color', async () => {
    await mountWidget()
    const card = component.findComponent({ name: 'Card' })

    expect(card.props('color')).toBe('secondary')
  })

  it('Should log the rolled dice and their total in the combat log', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await mountWidget()

    await component.find('[test-id="increment-d6"]').trigger('click')
    await component.find('[test-id="increment-d6"]').trigger('click')
    await component.find('[test-id="increment-d20"]').trigger('click')
    await component.find('[test-id="roll-dice"]').trigger('click')

    expect(mockLog).toHaveBeenCalledWith([
      {
        type: 'roll',
        rowId: null,
        payload: { kind: 'dice', total: 19, dice: '2d6, 1d20' },
      },
    ])
  })

  it('Should not log a roll without dice', async () => {
    await mountWidget()

    await component.find('[test-id="roll-dice"]').trigger('click')

    expect(mockLog).not.toHaveBeenCalled()
  })
})
