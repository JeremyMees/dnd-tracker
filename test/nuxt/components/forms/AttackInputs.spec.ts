import { defineComponent } from 'vue'
import { useForm } from 'vee-validate'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AttackInputs from '~/components/form/AttackInputs.vue'

function mountWithForm(attackType: DndAttackType = 'melee') {
  const Wrapper = defineComponent({
    components: { FormAttackInputs: AttackInputs },
    setup() {
      useForm({ initialValues: { attack: { attackType } } })
    },
    template: '<FormAttackInputs field-name="attack" />',
  })
  return mountSuspended(Wrapper)
}

describe('AttackInputs', () => {
  it('Should match snapshot', async () => {
    const component = await mountWithForm()
    expect(component.html()).toMatchSnapshot()
  })

  it('Should always render name, attackType, toHitMod and distanceUnit fields', async () => {
    const component = await mountWithForm()
    const html = component.html()

    expect(html).toContain('components.inputs.nameLabel')
    expect(html).toContain('components.inputs.attackTypeLabel')
    expect(html).toContain('components.inputs.toHitModLabel')
    expect(html).toContain('components.inputs.distanceUnitLabel')
  })

  it('Should always render damage and extra damage fields', async () => {
    const component = await mountWithForm()
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
    const component = await mountWithForm()

    expect(component.html()).toContain('components.inputs.targetCreatureOnlyLabel')
  })

  describe('Conditional fields based on attackType', () => {
    it('Should show reach for melee attack', async () => {
      const component = await mountWithForm('melee')

      expect(component.html()).toContain('components.inputs.reachLabel')
      expect(component.html()).not.toContain('components.inputs.rangeLabel')
      expect(component.html()).not.toContain('components.inputs.longRangeLabel')
    })

    it('Should show reach for meleeSpell attack', async () => {
      const component = await mountWithForm('meleeSpell')

      expect(component.html()).toContain('components.inputs.reachLabel')
      expect(component.html()).not.toContain('components.inputs.rangeLabel')
    })

    it('Should show range and longRange for ranged attack', async () => {
      const component = await mountWithForm('ranged')

      expect(component.html()).not.toContain('components.inputs.reachLabel')
      expect(component.html()).toContain('components.inputs.rangeLabel')
      expect(component.html()).toContain('components.inputs.longRangeLabel')
    })

    it('Should show range but not longRange for rangedSpell attack', async () => {
      const component = await mountWithForm('rangedSpell')

      expect(component.html()).not.toContain('components.inputs.reachLabel')
      expect(component.html()).toContain('components.inputs.rangeLabel')
      expect(component.html()).not.toContain('components.inputs.longRangeLabel')
    })

    it('Should show spell save fields for meleeSpell attack', async () => {
      const component = await mountWithForm('meleeSpell')

      expect(component.html()).toContain('components.inputs.spellSaveLabel')
      expect(component.html()).toContain('components.inputs.saveTypeLabel')
    })

    it('Should show spell save fields for rangedSpell attack', async () => {
      const component = await mountWithForm('rangedSpell')

      expect(component.html()).toContain('components.inputs.spellSaveLabel')
      expect(component.html()).toContain('components.inputs.saveTypeLabel')
    })

    it('Should not show spell save fields for physical attacks', async () => {
      for (const type of ['melee', 'ranged'] as DndAttackType[]) {
        const component = await mountWithForm(type)

        expect(component.html()).not.toContain('components.inputs.spellSaveLabel')
        expect(component.html()).not.toContain('components.inputs.saveTypeLabel')
      }
    })
  })
})
