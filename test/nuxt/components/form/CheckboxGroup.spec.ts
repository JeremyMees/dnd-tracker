import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CheckboxGroup from '~/components/form/CheckboxGroup.vue'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

const options: Option<string>[] = [
  { label: 'Acid', value: 'acid' },
  { label: 'Cold', value: 'cold' },
  { label: 'Fire', value: 'fire' },
]

function mountCheckboxGroup(
  props: Record<string, unknown> = {},
  damageImmunities: string[] = [],
) {
  return mountWithForm(CheckboxGroup, {
    props: { name: 'damageImmunities', options, ...props },
    initialValues: { damageImmunities },
  })
}

describe('CheckboxGroup', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountCheckboxGroup({ label: 'label' })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render a checkbox with a label per option', async () => {
    const { component } = await mountCheckboxGroup()

    const checkboxes = component.findAll('[role="checkbox"]')

    expect(checkboxes).toHaveLength(options.length)
    options.forEach(option => {
      expect(component.text()).toContain(option.label)
    })
  })

  it('Should render the group label when given', async () => {
    const { component } = await mountCheckboxGroup({ label: 'Damage' })

    expect(component.text()).toContain('Damage')
  })

  it('Should not render a group label when none is given', async () => {
    const { component } = await mountCheckboxGroup()

    options.forEach(option => {
      expect(component.text()).toContain(option.label)
    })
    expect(
      component
        .text()
        .replace(/Acid|Cold|Fire/g, '')
        .trim(),
    ).toBe('')
  })

  it('Should check the options that are already in the form value', async () => {
    const { component } = await mountCheckboxGroup({}, ['cold'])

    const checkboxes = component.findAll('[role="checkbox"]')

    expect(checkboxes[0]!.attributes('aria-checked')).toBe('false')
    expect(checkboxes[1]!.attributes('aria-checked')).toBe('true')
    expect(checkboxes[2]!.attributes('aria-checked')).toBe('false')
  })

  it('Should add the option to the form value when checked', async () => {
    const { component, form } = await mountCheckboxGroup()

    await component.findAll('[role="checkbox"]')[2]!.trigger('click')
    await flushPromises()

    expect(form.values.damageImmunities).toContain('fire')
  })

  it('Should remove the option from the form value when unchecked', async () => {
    const { component, form } = await mountCheckboxGroup({}, ['acid', 'fire'])

    await component.findAll('[role="checkbox"]')[0]!.trigger('click')
    await flushPromises()

    expect(form.values.damageImmunities).toEqual(['fire'])
  })

  it('Should apply the list class to the option grid', async () => {
    const { component } = await mountCheckboxGroup({
      listClass: 'grid-cols-2',
    })

    expect(component.html()).toContain('grid-cols-2')
  })
})
