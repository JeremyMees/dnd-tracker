import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ListInput from '~/components/form/ListInput.vue'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

function mountListInput(
  props: Record<string, unknown> = {},
  languages?: string[],
) {
  return mountWithForm(ListInput, {
    props: { name: 'languages', type: 'text', empty: '', ...props },
    initialValues: languages ? { languages } : {},
  })
}

describe('ListInput', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountListInput({ label: 'label' })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should not render a label when none is given', async () => {
    const { component } = await mountListInput()

    expect(component.find('[test-id="label"]').exists()).toBeFalsy()
  })

  it('Should render an input per item in the field array', async () => {
    const { component } = await mountListInput({}, ['Elvish', 'Dwarvish'])

    const inputs = component.findAll('input')

    expect(inputs).toHaveLength(2)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Elvish')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('Dwarvish')
  })

  it('Should append an empty item when adding', async () => {
    const { component, form } = await mountListInput({}, ['Elvish'])

    await component.get('[test-id="add"]').trigger('click')
    await flushPromises()

    expect(component.findAll('input')).toHaveLength(2)
    expect(form.values.languages).toEqual(['Elvish', ''])
  })

  it('Should remove the item at the clicked index', async () => {
    const { component, form } = await mountListInput({}, [
      'Elvish',
      'Dwarvish',
      'Orc',
    ])

    await component.findAll('[test-id="remove"]')[1]!.trigger('click')
    await flushPromises()

    expect(form.values.languages).toEqual(['Elvish', 'Orc'])
  })

  it('Should disable removing when the minimum is reached', async () => {
    const { component } = await mountListInput({ min: 2 }, [
      'Elvish',
      'Dwarvish',
    ])

    const buttons = component.findAll('[test-id="remove"]')

    expect(buttons).toHaveLength(2)
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('Should not remove past the minimum when clicked anyway', async () => {
    const { component, form } = await mountListInput({ min: 1 }, ['Elvish'])

    const remove = component.get('[test-id="remove"]')
    remove.element.removeAttribute('disabled')
    await remove.trigger('click')
    await flushPromises()

    expect(form.values.languages).toEqual(['Elvish'])
  })

  it('Should disable adding when the maximum is reached', async () => {
    const { component, form } = await mountListInput({ max: 2 }, [
      'Elvish',
      'Dwarvish',
    ])

    const add = component.get('[test-id="add"]')

    expect(add.attributes('disabled')).toBeDefined()

    add.element.removeAttribute('disabled')
    await add.trigger('click')
    await flushPromises()

    expect(form.values.languages).toHaveLength(2)
  })

  it('Should replace the add button with a max message at ten items', async () => {
    const languages = Array.from({ length: 10 }, (_, i) => `Language ${i}`)
    const { component } = await mountListInput({ max: 20 }, languages)

    expect(component.find('[test-id="add"]').exists()).toBeFalsy()
    expect(component.get('[test-id="max"]').text()).toBe('general.max 10')
  })
})
