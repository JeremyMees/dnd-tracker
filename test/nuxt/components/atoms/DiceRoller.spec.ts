import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DiceRoller from '~/components/atoms/DiceRoller.vue'

interface Props {
  styled?: boolean
}

interface DiceRollerVM {
  toRoll: Record<DndDice, number>
  calculateDndDiceRoll: () => void
}

const props: Props = { styled: true }

const mockToast = vi.fn()

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const DescriptionHost = defineComponent({
  props: ['node'],
  render() {
    return this.node
  },
})

async function renderDescription(node: unknown) {
  return await mountSuspended(DescriptionHost, { props: { node } })
}

describe('DiceRoller', () => {
  beforeEach(() => {
    mockToast.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DiceRoller, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render dice rollers correctly', async () => {
    const component = await mountSuspended(DiceRoller, { props })

    expect(component.html()).toContain('d4')
    expect(component.html()).toContain('d6')
    expect(component.html()).toContain('d8')
    expect(component.html()).toContain('d10')
    expect(component.html()).toContain('d12')
    expect(component.html()).toContain('d20')
    expect(component.html()).toContain('d100')
  })

  describe('Dice count controls', () => {
    it('Should start with every dice count at zero', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      expect(vm.toRoll).toEqual({
        d4: 0,
        d6: 0,
        d8: 0,
        d10: 0,
        d12: 0,
        d20: 0,
        d100: 0,
      })
    })

    it('Should increment a dice count from zero when clicking the increment button', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      await component.find('[test-id="increment-d6"]').trigger('click')

      expect(vm.toRoll.d6).toBe(1)
      expect(component.find('[test-id="count-d6"]').text()).toBe('1')
    })

    it('Should increment a dice count further when already non-zero', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      await component.find('[test-id="increment-d6"]').trigger('click')
      await component.find('[test-id="increment-d6"]').trigger('click')

      expect(vm.toRoll.d6).toBe(2)
    })

    it('Should decrement a dice count when clicking the decrement button', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      await component.find('[test-id="increment-d6"]').trigger('click')
      await component.find('[test-id="increment-d6"]').trigger('click')
      await component.find('[test-id="decrement-d6"]').trigger('click')

      expect(vm.toRoll.d6).toBe(1)
    })

    it('Should disable the increment button once a dice count reaches 100', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      vm.toRoll.d20 = 100
      await nextTick()

      expect(
        component.find('[test-id="increment-d20"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('Should disable the decrement button while a dice count is zero', async () => {
      const component = await mountSuspended(DiceRoller, { props })

      expect(
        component.find('[test-id="decrement-d20"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('Should keep a dice count at zero when the decrement handler runs while already at zero', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM
      const decrementButton = component.find('[test-id="decrement-d6"]')
      decrementButton.element.removeAttribute('disabled')

      await decrementButton.trigger('click')

      expect(vm.toRoll.d6).toBe(0)
    })

    it('Should disable the roll button while every dice count is zero and enable it otherwise', async () => {
      const component = await mountSuspended(DiceRoller, { props })

      expect(
        component.find('[test-id="roll-dice"]').attributes('disabled'),
      ).toBeDefined()

      await component.find('[test-id="increment-d4"]').trigger('click')

      expect(
        component.find('[test-id="roll-dice"]').attributes('disabled'),
      ).toBeUndefined()
    })
  })

  describe('Rolling dice', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('Should roll a single dice type once, emit the total, reset counts and toast a singular title', async () => {
      vi.spyOn(Math, 'random').mockReturnValueOnce(0)

      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      vm.toRoll.d6 = 1
      vm.calculateDndDiceRoll()
      await nextTick()

      expect(component.emitted('rolled')![0]).toEqual([1])
      expect(vm.toRoll).toEqual({
        d4: 0,
        d6: 0,
        d8: 0,
        d10: 0,
        d12: 0,
        d20: 0,
        d100: 0,
      })

      expect(mockToast).toHaveBeenCalledTimes(1)
      const call = mockToast.mock.calls[0]![0]
      expect(call.title).toBe('components.diceRoll.rolled')

      const description = await renderDescription(call.description)
      expect(description.find('.text-destructive').exists()).toBe(true)
      expect(description.find('.text-success').exists()).toBe(false)
      expect(description.text()).not.toContain('general.total')
    })

    it('Should roll a single dice type multiple times, highlight extremes and show a total', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99999)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)

      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      vm.toRoll.d20 = 3
      vm.calculateDndDiceRoll()
      await nextTick()

      expect(component.emitted('rolled')![0]).toEqual([32])

      const call = mockToast.mock.calls[0]![0]
      expect(call.title).toBe('components.diceRoll.rolled')

      const description = await renderDescription(call.description)
      expect(description.find('.text-success').exists()).toBe(true)
      expect(description.find('.text-destructive').exists()).toBe(true)
      expect(description.text()).toContain('general.total')
      expect(description.text()).toContain('32')
    })

    it('Should roll multiple dice types, combine their total and toast a plural title', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.99999)

      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      vm.toRoll.d4 = 1
      vm.toRoll.d6 = 1
      vm.calculateDndDiceRoll()
      await nextTick()

      expect(component.emitted('rolled')![0]).toEqual([7])

      const call = mockToast.mock.calls[0]![0]
      expect(call.title).toBe('components.diceRoll.rolled')

      const description = await renderDescription(call.description)
      expect(description.text()).toContain('d4')
      expect(description.text()).toContain('d6')
      expect(description.text()).toContain('general.total')
      expect(description.text()).toContain('7')
    })

    it('Should handle rolling when no dice are selected', async () => {
      const component = await mountSuspended(DiceRoller, { props })
      const vm = component.vm as unknown as DiceRollerVM

      vm.calculateDndDiceRoll()
      await nextTick()

      expect(component.emitted('rolled')![0]).toEqual([0])

      const call = mockToast.mock.calls[0]![0]
      expect(call.title).toBe('components.diceRoll.rolled')

      const description = await renderDescription(call.description)
      expect(description.text()).not.toContain('general.total')
    })
  })
})
