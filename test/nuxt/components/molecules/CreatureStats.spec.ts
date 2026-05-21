import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CreatureStats from '~/components/molecules/CreatureStats.vue'
import { dndMonsterFixture } from '~~/test/nuxt/fixtures/open5e'

const props = { creature: dndMonsterFixture }

describe('CreatureStats', () => {
  it('should match snapshot', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('should render saving throws section', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.find('[data-test-saving-throws]').exists()).toBeTruthy()
  })

  it('should render speed section with entries', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.find('[data-test-speed]').exists()).toBeTruthy()
    expect(component.findAll('[data-test-speed-entry]').length).toBeGreaterThan(0)
  })

  it('should render senses section with entries', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.find('[data-test-senses]').exists()).toBeTruthy()
    expect(component.findAll('[data-test-sense-entry]').length).toBeGreaterThan(0)
  })

  it('should render skills section with entries', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.find('[data-test-skills]').exists()).toBeTruthy()
    expect(component.findAll('[data-test-skill-entry]').length).toBeGreaterThan(0)
  })

  it('should render languages section', async () => {
    const component = await mountSuspended(CreatureStats, { props })
    const languages = component.find('[data-test-languages]')

    expect(languages.exists()).toBeTruthy()
    expect(languages.text()).toContain('Deep Speech')
  })

  it('should not render resistances section when creature has none', async () => {
    const component = await mountSuspended(CreatureStats, { props })

    expect(component.find('[data-test-resistances]').exists()).toBeFalsy()
  })

  it('should render resistances section when creature has resistances', async () => {
    const creature = {
      ...dndMonsterFixture,
      resistancesAndImmunities: {
        ...dndMonsterFixture.resistancesAndImmunities,
        damageImmunities: ['fire'],
      } as DndResistancesAndImmunities,
    }

    const component = await mountSuspended(CreatureStats, { props: { creature } })

    expect(component.find('[data-test-resistances]').exists()).toBeTruthy()
    expect(component.find('[data-test-resistances]').text()).toContain('fire')
  })

  it('should render traits section with correct entries', async () => {
    const component = await mountSuspended(CreatureStats, { props })
    const traits = component.findAll('[data-test-trait]')

    expect(component.find('[data-test-traits]').exists()).toBeTruthy()
    expect(traits).toHaveLength(dndMonsterFixture.traits.length)
    expect(traits[0]!.text()).toContain('Amphibious')
  })

  it('should hide sections when creature has no data for them', async () => {
    const creature = {
      ...dndMonsterFixture,
      savingThrows: {} as DndSavingThrowBonuses,
      speed: { ...dndMonsterFixture.speed, walk: 0, swim: undefined },
      skillBonuses: {} as DndSkillBonuses,
      languages: [],
      traits: [],
    }

    const component = await mountSuspended(CreatureStats, { props: { creature } })

    expect(component.find('[data-test-saving-throws]').exists()).toBeFalsy()
    expect(component.find('[data-test-skills]').exists()).toBeFalsy()
    expect(component.find('[data-test-languages]').exists()).toBeFalsy()
    expect(component.find('[data-test-traits]').exists()).toBeFalsy()
  })

  it('should render languages from a string array (homebrew)', async () => {
    const creature = { ...dndMonsterFixture, languages: ['Common', 'Elvish'] }
    const component = await mountSuspended(CreatureStats, { props: { creature } })
    const languages = component.find('[data-test-languages]')

    expect(languages.exists()).toBeTruthy()
    expect(languages.text()).toContain('Common')
    expect(languages.text()).toContain('Elvish')
  })

  it('should hide speed and sight sections when null (homebrew)', async () => {
    const creature = { ...dndMonsterFixture, speed: null, sight: null }
    const component = await mountSuspended(CreatureStats, { props: { creature } })

    expect(component.find('[data-test-speed]').exists()).toBeFalsy()
    expect(component.find('[data-test-senses]').exists()).toBeFalsy()
  })
})
