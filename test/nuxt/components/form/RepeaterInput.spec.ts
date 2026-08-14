import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RepeaterInput from '~/components/form/RepeaterInput.vue'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

interface Trait {
  name: string
  desc: string
}

const emptyObject: Trait = { name: '', desc: '' }

function mountRepeaterInput(
  props: Record<string, unknown> = {},
  traits?: Trait[],
) {
  return mountWithForm(RepeaterInput, {
    props: { name: 'traits', emptyObject, ...props },
    slots: {
      item: slotProps =>
        h('div', { 'test-id': 'item' }, String(slotProps.fieldName)),
    },
    initialValues: traits ? { traits } : {},
  })
}

const traits: Trait[] = [
  { name: 'Keen Smell', desc: 'Advantage on smell checks' },
  { name: 'Pack Tactics', desc: 'Advantage when allies are near' },
]

describe('RepeaterInput', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountRepeaterInput({ label: 'label' })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show the empty state when there are no items', async () => {
    const { component } = await mountRepeaterInput()

    expect(component.findAll('[test-id="item"]')).toHaveLength(0)
    expect(component.text()).toContain('components.repeaterInput.noItems')
  })

  it('Should not render a label when none is given', async () => {
    const { component } = await mountRepeaterInput()

    expect(component.find('[test-id="label"]').exists()).toBeFalsy()
  })

  it('Should render the item slot with an indexed field name', async () => {
    const { component } = await mountRepeaterInput({}, traits)

    const items = component.findAll('[test-id="item"]')

    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toBe('traits.0')
    expect(items[1]!.text()).toBe('traits.1')
  })

  it('Should prepend an empty object when adding', async () => {
    const { component, form } = await mountRepeaterInput({}, traits)

    await component.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(component.findAll('[test-id="item"]')).toHaveLength(3)
    expect((form.values.traits as Trait[])[0]).toEqual(emptyObject)
  })

  it('Should disable adding when the maximum is reached', async () => {
    const { component, form } = await mountRepeaterInput({ max: 2 }, traits)

    const add = component.findAll('button')[0]!

    expect(add.attributes('disabled')).toBeDefined()

    await add.trigger('click')
    await flushPromises()

    expect(form.values.traits).toHaveLength(2)
  })

  it('Should move an item up', async () => {
    const { component, form } = await mountRepeaterInput({}, traits)

    await component.get('[test-id="move-up-1"]').trigger('click')
    await flushPromises()

    expect((form.values.traits as Trait[]).map(t => t.name)).toEqual([
      'Pack Tactics',
      'Keen Smell',
    ])
  })

  it('Should move an item down', async () => {
    const { component, form } = await mountRepeaterInput({}, traits)

    await component.get('[test-id="move-down-0"]').trigger('click')
    await flushPromises()

    expect((form.values.traits as Trait[]).map(t => t.name)).toEqual([
      'Pack Tactics',
      'Keen Smell',
    ])
  })

  it('Should disable moving outside of the bounds of the list', async () => {
    const { component } = await mountRepeaterInput({}, traits)

    expect(
      component.get('[test-id="move-up-0"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="move-down-1"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="move-up-1"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      component.get('[test-id="move-down-0"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should remove the item at the clicked index', async () => {
    const { component, form } = await mountRepeaterInput({}, traits)

    await component.get('[test-id="remove-0"]').trigger('click')
    await flushPromises()

    expect((form.values.traits as Trait[]).map(t => t.name)).toEqual([
      'Pack Tactics',
    ])
  })

  it('Should disable removing when the minimum is reached', async () => {
    const { component } = await mountRepeaterInput({ min: 2 }, traits)

    expect(
      component.get('[test-id="remove-0"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="remove-1"]').attributes('disabled'),
    ).toBeDefined()
  })
})
