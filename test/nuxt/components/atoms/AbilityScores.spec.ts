import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AbilityScores from '~/components/atoms/AbilityScores.vue'
import type { DndAbilityScores, DndModifiers } from '#shared/types/dnd'

const abilityScores: DndAbilityScores = {
  strength: 18,
  dexterity: 14,
  constitution: 16,
  intelligence: 10,
  wisdom: 12,
  charisma: 8,
}

const modifiers: DndModifiers = {
  strength: 4,
  dexterity: 2,
  constitution: 3,
  intelligence: 0,
  wisdom: 1,
  charisma: -1,
}

const props = { abilityScores, modifiers }

describe('AbilityScores', () => {
  it('should match snapshot', async () => {
    const component = await mountSuspended(AbilityScores, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('should render all 6 ability score blocks', async () => {
    const component = await mountSuspended(AbilityScores, { props })

    expect(component.findAll('[data-test-ability-block]')).toHaveLength(6)
  })

  it('should display each ability abbreviation', async () => {
    const component = await mountSuspended(AbilityScores, { props })
    const labels = component.findAll('[data-test-ability-label]').map(el => el.text())

    expect(labels).toContain('STR')
    expect(labels).toContain('DEX')
    expect(labels).toContain('CON')
    expect(labels).toContain('INT')
    expect(labels).toContain('WIS')
    expect(labels).toContain('CHA')
  })

  it('should display formatted modifiers with + prefix for positive values', async () => {
    const component = await mountSuspended(AbilityScores, { props })
    const modifierTexts = component.findAll('[data-test-ability-modifier]').map(el => el.text())

    expect(modifierTexts).toContain('+4')
    expect(modifierTexts).toContain('+2')
    expect(modifierTexts).toContain('+3')
    expect(modifierTexts).toContain('+0')
    expect(modifierTexts).toContain('+1')
  })

  it('should display formatted modifier with - prefix for negative values', async () => {
    const component = await mountSuspended(AbilityScores, { props })
    const modifierTexts = component.findAll('[data-test-ability-modifier]').map(el => el.text())

    expect(modifierTexts).toContain('-1')
  })

  it('should display raw ability scores', async () => {
    const component = await mountSuspended(AbilityScores, { props })
    const scoreTexts = component.findAll('[data-test-ability-score]').map(el => el.text())

    expect(scoreTexts).toContain('18')
    expect(scoreTexts).toContain('14')
    expect(scoreTexts).toContain('16')
    expect(scoreTexts).toContain('10')
    expect(scoreTexts).toContain('12')
    expect(scoreTexts).toContain('8')
  })
})
