import { describe, expect, it } from 'vitest'
import AttackInputs from '~/components/form/AttackInputs.vue'
import { mountWithForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

async function mountAttackInputs(attackType: DndAttackType = 'melee') {
  const { component } = await mountWithForm(AttackInputs, {
    props: { fieldName: 'attack' },
    initialValues: { attack: { attackType } },
  })

  return component
}

describe('AttackInputs', () => {
  it('Should match snapshot', async () => {
    const component = await mountAttackInputs()
    expect(component.html()).toMatchSnapshot()
  })

  it('Should always render name, attackType, toHitMod and distanceUnit fields', async () => {
    const component = await mountAttackInputs()
    const html = component.html()

    expect(html).toContain('components.inputs.nameLabel')
    expect(html).toContain('components.inputs.attackTypeLabel')
    expect(html).toContain('components.inputs.toHitModLabel')
    expect(html).toContain('components.inputs.distanceUnitLabel')
  })

  it('Should always render damage and extra damage fields', async () => {
    const component = await mountAttackInputs()
    const html = component.html()

    expect(html).toContain('components.inputs.damageDieCountLabel')
    expect(html).toContain('components.inputs.damageDieTypeLabel')
    expect(html).toContain('components.inputs.damageBonusLabel')
    expect(html).toContain('components.inputs.damageTypeLabel')
    expect(html).toContain('components.inputs.extraDamageDieCountLabel')
    expect(html).toContain('components.inputs.extraDamageDieTypeLabel')
    expect(html).toContain('components.inputs.extraDamageBonusLabel')
    expect(html).toContain('components.inputs.extraDamageTypeLabel')
  })

  it('Should always render the targetCreatureOnly checkbox', async () => {
    const component = await mountAttackInputs()

    expect(component.html()).toContain(
      'components.inputs.targetCreatureOnlyLabel',
    )
  })

  describe('Conditional fields based on attackType', () => {
    it('Should show reach for melee attack', async () => {
      const component = await mountAttackInputs('melee')

      expect(component.html()).toContain('components.inputs.reachLabel')
      expect(component.html()).not.toContain('components.inputs.rangeLabel')
      expect(component.html()).not.toContain('components.inputs.longRangeLabel')
    })

    it('Should show reach for meleeSpell attack', async () => {
      const component = await mountAttackInputs('meleeSpell')

      expect(component.html()).toContain('components.inputs.reachLabel')
      expect(component.html()).not.toContain('components.inputs.rangeLabel')
    })

    it('Should show range and longRange for ranged attack', async () => {
      const component = await mountAttackInputs('ranged')

      expect(component.html()).not.toContain('components.inputs.reachLabel')
      expect(component.html()).toContain('components.inputs.rangeLabel')
      expect(component.html()).toContain('components.inputs.longRangeLabel')
    })

    it('Should show range but not longRange for rangedSpell attack', async () => {
      const component = await mountAttackInputs('rangedSpell')

      expect(component.html()).not.toContain('components.inputs.reachLabel')
      expect(component.html()).toContain('components.inputs.rangeLabel')
      expect(component.html()).not.toContain('components.inputs.longRangeLabel')
    })

    it('Should show spell save fields for meleeSpell attack', async () => {
      const component = await mountAttackInputs('meleeSpell')

      expect(component.html()).toContain('components.inputs.spellSaveLabel')
      expect(component.html()).toContain('components.inputs.saveTypeLabel')
    })

    it('Should show spell save fields for rangedSpell attack', async () => {
      const component = await mountAttackInputs('rangedSpell')

      expect(component.html()).toContain('components.inputs.spellSaveLabel')
      expect(component.html()).toContain('components.inputs.saveTypeLabel')
    })

    it('Should not show spell save fields for physical attacks', async () => {
      for (const type of ['melee', 'ranged'] as DndAttackType[]) {
        const component = await mountAttackInputs(type)

        expect(component.html()).not.toContain(
          'components.inputs.spellSaveLabel',
        )
        expect(component.html()).not.toContain(
          'components.inputs.saveTypeLabel',
        )
      }
    })

    it('Should set the spell save type when an ability is picked', async () => {
      const component = await mountAttackInputs('meleeSpell')

      await selectOption(component, 'strength', { index: -1 })

      expect(component.html()).toContain('Strength')
    })

    it('Should clear the spell save type when none is picked', async () => {
      const { component } = await mountWithForm(AttackInputs, {
        props: { fieldName: 'attack' },
        initialValues: {
          attack: { attackType: 'meleeSpell', spellSaveType: 'strength' },
        },
      })

      expect(component.html()).toContain('Strength')

      await selectOption(component, 'none', { index: -1 })

      expect(component.html()).not.toContain('Strength')
    })
  })
})
