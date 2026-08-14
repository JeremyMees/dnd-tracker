import { describe, expect, it } from 'vitest'
import HomebrewStats from '~/components/form/HomebrewStats.vue'
import { abilityTypeMap, abilityTypes, skillMap } from '~~/constants/dnd'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

function mountHomebrewStats(initialValues: Record<string, unknown> = {}) {
  return mountWithForm(HomebrewStats, { initialValues })
}

describe('HomebrewStats', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountHomebrewStats()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render a section per stat group', async () => {
    const { component } = await mountHomebrewStats()
    const text = component.text()

    expect(text).toContain('general.ability')
    expect(text).toContain('components.inputs.modifiersLabel')
    expect(text).toContain('general.savingThrow')
    expect(text).toContain('components.inputs.skillBonusesLabel')
  })

  it('Should render an input for every ability, modifier and saving throw', async () => {
    const { component } = await mountHomebrewStats()

    abilityTypes.forEach(short => {
      const ability = abilityTypeMap[short]

      expect(
        component.find(`input[name="abilityScores.${ability}"]`).exists(),
      ).toBeTruthy()
      expect(
        component.find(`input[name="modifiers.${ability}"]`).exists(),
      ).toBeTruthy()
      expect(
        component.find(`input[name="savingThrows.${ability}"]`).exists(),
      ).toBeTruthy()
    })
  })

  it('Should render an input for every skill', async () => {
    const { component } = await mountHomebrewStats()

    Object.keys(skillMap).forEach(skill => {
      expect(
        component.find(`input[name="skillBonuses.${skill}"]`).exists(),
      ).toBeTruthy()
    })
  })

  it('Should render every input as a number input', async () => {
    const { component } = await mountHomebrewStats()

    const inputs = component.findAll('input')
    const expected = abilityTypes.length * 3 + Object.keys(skillMap).length

    expect(inputs).toHaveLength(expected)
    inputs.forEach(input => {
      expect(input.attributes('type')).toBe('number')
    })
  })

  it('Should show the values that are already in the form', async () => {
    const { component } = await mountHomebrewStats({
      abilityScores: { strength: 18 },
      modifiers: { dexterity: -1 },
      skillBonuses: { arcana: 7 },
    })

    expect(
      component.get<HTMLInputElement>('input[name="abilityScores.strength"]')
        .element.value,
    ).toBe('18')
    expect(
      component.get<HTMLInputElement>('input[name="modifiers.dexterity"]')
        .element.value,
    ).toBe('-1')
    expect(
      component.get<HTMLInputElement>('input[name="skillBonuses.arcana"]')
        .element.value,
    ).toBe('7')
  })
})
