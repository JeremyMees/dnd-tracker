import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InitiativeSettingsFields from '~/components/form/InitiativeSettingsFields.vue'
import {
  initiativeDefaultRows,
  initiativeWidgets,
} from '~~/constants/validation'
import { initiativeSettingsInitialValues } from '~/utils/form-schema'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

function mountFields(settings?: InitiativeSettings) {
  return mountWithForm(InitiativeSettingsFields, {
    initialValues: initiativeSettingsInitialValues(settings),
  })
}

describe('InitiativeSettingsFields', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountFields()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render every settings group', async () => {
    const { component } = await mountFields()
    const text = component.text()

    expect(text).toContain('components.initiativeSettings.spacing')
    expect(text).toContain('components.initiativeSettings.rows')
    expect(text).toContain('components.initiativeSettings.widgets')
    expect(text).toContain('components.initiativeSettings.pets.label')
    expect(text).toContain('components.initiativeSettings.negative')
  })

  it('Should render a radio per spacing option', async () => {
    const { component } = await mountFields()

    const radios = component.findAll('[role="radio"]')

    expect(radios).toHaveLength(3)
    expect(component.text()).toContain('Compact')
    expect(component.text()).toContain('Normal')
    expect(component.text()).toContain('Cozy')
  })

  it('Should render a checkbox per row and widget option', async () => {
    const { component } = await mountFields()

    const checkboxes = component.findAll('[role="checkbox"]')

    expect(checkboxes).toHaveLength(7 + initiativeWidgets.length)
  })

  it('Should check every row and widget by default', async () => {
    const { component, form } = await mountFields()

    const checked = component
      .findAll('[role="checkbox"]')
      .filter(box => box.attributes('aria-checked') === 'true')

    expect(checked).toHaveLength(7 + initiativeWidgets.length)
    expect(form.values.rows).toEqual([...initiativeDefaultRows])
    expect(form.values.widgets).toEqual([...initiativeWidgets])
  })

  it('Should only check the saved rows and widgets of a modified sheet', async () => {
    const { component, form } = await mountFields({
      spacing: 'compact',
      rows: ['armorClass'],
      widgets: ['note'],
      modified: true,
      negative: true,
    })

    const checked = component
      .findAll('[role="checkbox"]')
      .filter(box => box.attributes('aria-checked') === 'true')

    expect(checked).toHaveLength(2)
    expect(form.values.rows).toEqual(['armorClass'])
    expect(form.values.widgets).toEqual(['note'])
  })

  it('Should select the saved spacing', async () => {
    const { component } = await mountFields({
      spacing: 'cozy',
      rows: [],
      widgets: [],
      modified: true,
      negative: false,
    })

    const checked = component
      .findAll('[role="radio"]')
      .filter(radio => radio.attributes('aria-checked') === 'true')

    expect(checked).toHaveLength(1)
    expect(checked[0]!.attributes('value')).toBe('cozy')
  })

  it('Should update the form when a row is unchecked', async () => {
    const { component, form } = await mountFields()

    await component.findAll('[role="checkbox"]')[0]!.trigger('click')
    await flushPromises()

    expect(form.values.rows).not.toContain('armorClass')
  })

  it('Should toggle the negative switch', async () => {
    const { component, form } = await mountFields()

    expect(form.values.negative).toBe(false)

    await component.get('[role="switch"]').trigger('click')
    await flushPromises()

    expect(form.values.negative).toBe(true)
  })

  it('Should start with the negative switch on when the sheet allows it', async () => {
    const { component } = await mountFields({
      spacing: 'normal',
      rows: [],
      widgets: [],
      modified: true,
      negative: true,
    })

    expect(component.get('[role="switch"]').attributes('aria-checked')).toBe(
      'true',
    )
  })
})
