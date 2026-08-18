import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomebrewTraits from '~/components/form/HomebrewTraits.vue'
import {
  conditionTypes,
  damageTypes,
  resistanceTypeMap,
} from '~~/constants/dnd'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

const traits = [{ name: 'Keen Smell', desc: 'Advantage on smell checks' }]

const emptyResistances = {
  damageImmunities: [],
  damageResistances: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
}

function mountHomebrewTraits({
  resistancesAndImmunities = {},
  ...initialValues
}: Record<string, unknown> = {}) {
  return mountWithForm(HomebrewTraits, {
    initialValues: {
      ...initialValues,
      resistancesAndImmunities: {
        ...emptyResistances,
        ...(resistancesAndImmunities as Record<string, string[]>),
      },
    },
  })
}

describe('HomebrewTraits', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountHomebrewTraits()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the traits repeater with an empty state', async () => {
    const { component } = await mountHomebrewTraits()

    expect(component.text()).toContain('components.inputs.traitsLabel')
    expect(component.text()).toContain('components.repeaterInput.noItems')
  })

  it('Should render a name and description field per trait', async () => {
    const { component } = await mountHomebrewTraits({ traits })

    expect(
      component.get<HTMLInputElement>('input[name="traits.0.name"]').element
        .value,
    ).toBe('Keen Smell')
    expect(
      component.get<HTMLTextAreaElement>('textarea[name="traits.0.desc"]')
        .element.value,
    ).toBe('Advantage on smell checks')
  })

  it('Should add a trait through the repeater', async () => {
    const { component, form } = await mountHomebrewTraits({ traits })

    await component.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(form.values.traits).toHaveLength(2)
    expect(component.findAll('input[name$=".name"]')).toHaveLength(2)
  })

  it('Should render a checkbox group per resistance type', async () => {
    const { component } = await mountHomebrewTraits()
    const text = component.text()

    Object.values(resistanceTypeMap).forEach(label => {
      expect(text).toContain(label)
    })
  })

  it('Should offer every damage type three times and every condition once', async () => {
    const { component } = await mountHomebrewTraits()

    const checkboxes = component.findAll('[role="checkbox"]')
    const expected = damageTypes.length * 3 + conditionTypes.length

    expect(checkboxes).toHaveLength(expected)
  })

  it('Should check the resistances that are already in the form value', async () => {
    const { component, form } = await mountHomebrewTraits({
      resistancesAndImmunities: { damageImmunities: ['acid'] },
    })

    const checked = component
      .findAll('[role="checkbox"]')
      .filter(box => box.attributes('aria-checked') === 'true')

    expect(checked).toHaveLength(1)
    expect(
      (form.values.resistancesAndImmunities as Record<string, string[]>)
        .damageImmunities,
    ).toEqual(['acid'])
  })
})
