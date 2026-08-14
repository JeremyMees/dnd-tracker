import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardSpell from '~/components/molecules/ContentCard/ContentCardSpell.vue'
import { dndSpellFixture } from '~~/test/fixtures/open5e'

interface Props {
  content: DndSpell
  isOpen: boolean
}

const props: Props = {
  content: dndSpellFixture,
  isOpen: false,
}

describe('ContentCardSpell', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardSpell, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props (collapsed)', async () => {
    const component = await mountSuspended(ContentCardSpell, { props })

    expect(component.text()).toContain('A shimmering green arrow')
    expect(component.find('[test-id="separator"]').exists()).toBeFalsy()
    expect(component.text()).not.toContain('Level: 2')
  })

  it('Should render expanded when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardSpell, {
      props: { ...props, isOpen: true },
    })

    expect(component.find('[test-id="separator"]').exists()).toBeTruthy()
    expect(component.text()).toContain('Level: 2')
    expect(component.text()).toContain('School: evocation')
    expect(component.text()).toContain('Classes: wizard')
  })

  it('Should hide optional fields when they are not present', async () => {
    const content = {
      ...dndSpellFixture,
      desc: undefined,
      level: undefined,
      higherLevel: undefined,
      school: undefined,
      classes: undefined,
      castingTime: undefined,
      duration: undefined,
      concentration: false,
      rangeText: undefined,
      verbal: false,
      somatic: false,
      material: false,
      ritual: false,
      targetType: undefined,
      targetCount: undefined,
      shapeType: undefined,
      shapeSize: undefined,
      attackRoll: undefined,
      damageRoll: undefined,
      damageTypes: [],
      savingThrowAbility: undefined,
      reactionCondition: undefined,
      materialCost: undefined,
      materialConsumed: undefined,
    } as unknown as DndSpell

    const component = await mountSuspended(ContentCardSpell, {
      props: { content, isOpen: true },
    })

    expect(component.text()).not.toContain('Level:')
    expect(component.text()).not.toContain('Higher level:')
    expect(component.text()).not.toContain('School:')
    expect(component.text()).not.toContain('Classes:')
    expect(component.text()).not.toContain('Casting time:')
    expect(component.text()).not.toContain('Duration:')
    expect(component.text()).not.toContain('Concentration:')
    expect(component.text()).not.toContain('Range:')
    expect(component.text()).not.toContain('Components:')
    expect(component.text()).not.toContain('Ritual:')
    expect(component.text()).not.toContain('Target type:')
    expect(component.text()).not.toContain('Target count:')
    expect(component.text()).not.toContain('Shape type:')
    expect(component.text()).not.toContain('Shape size:')
    expect(component.text()).not.toContain('Attack roll:')
    expect(component.text()).not.toContain('Damage roll:')
    expect(component.text()).not.toContain('Damage types:')
    expect(component.text()).not.toContain('Saving throw:')
    expect(component.text()).not.toContain('Reaction condition:')
    expect(component.text()).not.toContain('Material cost:')
    expect(component.text()).not.toContain('Material consumed:')
  })

  it('Should show alternate optional field values when present', async () => {
    const content = {
      ...dndSpellFixture,
      concentration: true,
      ritual: true,
      shapeType: 'cone',
      shapeSize: 15,
      attackRoll: false,
      savingThrowAbility: 'wisdom',
      reactionCondition: 'when hit',
      materialCost: 50,
      materialConsumed: true,
      verbal: false,
      somatic: false,
      material: true,
      materialSpecified: undefined,
    } as unknown as DndSpell

    const component = await mountSuspended(ContentCardSpell, {
      props: { content, isOpen: true },
    })

    expect(component.text()).toContain('Concentration: Yes')
    expect(component.text()).toContain('Ritual: general.yes')
    expect(component.text()).toContain('Shape type: cone')
    expect(component.text()).toContain('Shape size: 15')
    expect(component.text()).toContain('Attack roll: general.no')
    expect(component.text()).toContain('Saving throw: wisdom')
    expect(component.text()).toContain('Reaction condition: when hit')
    expect(component.text()).toContain('Material cost: 50')
    expect(component.text()).toContain('Material consumed: general.yes')

    const componentsParagraph = component
      .findAll('p')
      .find(p => p.text().startsWith('Components:'))

    expect(componentsParagraph?.text()).toBe('Components: M')
  })

  it('Should render verbal and somatic components without material', async () => {
    const content: DndSpell = {
      ...dndSpellFixture,
      verbal: true,
      somatic: true,
      material: false,
    }

    const component = await mountSuspended(ContentCardSpell, {
      props: { content, isOpen: true },
    })

    const componentsParagraph = component
      .findAll('p')
      .find(p => p.text().startsWith('Components:'))

    expect(componentsParagraph?.text()).toBe(
      `Components: V, S (${dndSpellFixture.materialSpecified})`,
    )
  })
})
