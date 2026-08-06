import { defineComponent } from 'vue'
import { useForm } from 'vee-validate'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import HomebrewInformation from '~/components/form/HomebrewInformation.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'

function mountWithForm(type?: string, initiativeSheet?: InitiativeSheet) {
  const Wrapper = defineComponent({
    components: { FormHomebrewInformation: HomebrewInformation },
    setup() {
      useForm({ initialValues: { type } })
      return { type, initiativeSheet }
    },
    template:
      '<FormHomebrewInformation :type="type" :sheet="initiativeSheet" />',
  })
  return mountSuspended(Wrapper)
}

function isHidden(el: HTMLElement) {
  return el.style.display === 'none'
}

describe('HomebrewInformation', () => {
  it('Should always render the type, name, initiativeModifier and link fields', async () => {
    const component = await mountWithForm()
    const html = component.html()

    expect(html).toContain('components.inputs.typeLabel')
    expect(html).toContain('components.inputs.nameLabel')
    expect(html).toContain(`${'components.inputs.initiativeLabel'} (MODIFIER)`)
    expect(html).toContain('components.inputs.linkLabel')
  })

  describe('Amount field', () => {
    it('Should not show amount without a sheet', async () => {
      const component = await mountWithForm('monster')
      expect(component.html()).not.toContain('components.inputs.amountLabel')
    })

    it('Should not show amount for types other than monster/summon', async () => {
      const component = await mountWithForm('npc', sheet)
      expect(component.html()).not.toContain('components.inputs.amountLabel')
    })

    it('Should show amount for monster with a sheet', async () => {
      const component = await mountWithForm('monster', sheet)
      expect(component.html()).toContain('components.inputs.amountLabel')
    })

    it('Should show amount for summon with a sheet', async () => {
      const component = await mountWithForm('summon', sheet)
      expect(component.html()).toContain('components.inputs.amountLabel')
    })
  })

  describe('Summoner field', () => {
    it('Should not show summoner without a sheet', async () => {
      const component = await mountWithForm('summon')
      expect(component.html()).not.toContain('components.inputs.summonerLabel')
    })

    it('Should not show summoner for types other than summon', async () => {
      const component = await mountWithForm('npc', sheet)
      expect(component.html()).not.toContain('components.inputs.summonerLabel')
    })

    it('Should show summoner for summon with a sheet', async () => {
      const component = await mountWithForm('summon', sheet)
      expect(component.html()).toContain('components.inputs.summonerLabel')
    })
  })

  describe('Player field', () => {
    it('Should show player field for player type without a sheet', async () => {
      const component = await mountWithForm('player')
      expect(component.html()).toContain('components.inputs.playerLabel')
    })

    it('Should not show player field for player type with a sheet', async () => {
      const component = await mountWithForm('player', sheet)
      expect(component.html()).not.toContain('components.inputs.playerLabel')
    })

    it('Should not show player field for non-player types', async () => {
      const component = await mountWithForm('npc')
      expect(component.html()).not.toContain('components.inputs.playerLabel')
    })
  })

  describe('Initiative field', () => {
    it('Should not show initiative without a sheet', async () => {
      const component = await mountWithForm('npc')
      expect(component.find('input[name="initiative"]').exists()).toBeFalsy()
    })

    it('Should show initiative with a sheet', async () => {
      const component = await mountWithForm('npc', sheet)
      expect(component.find('input[name="initiative"]').exists()).toBeTruthy()
    })
  })

  describe('AC and HP fields', () => {
    it('Should show AC and HP for non-lair types', async () => {
      const component = await mountWithForm('npc')
      const html = component.html()

      expect(html).toContain('components.inputs.acLabel')
      expect(html).toContain('components.inputs.hpLabel')
    })

    it('Should not show AC and HP for lair type', async () => {
      const component = await mountWithForm('lair')
      const html = component.html()

      expect(html).not.toContain('components.inputs.acLabel')
      expect(html).not.toContain('components.inputs.hpLabel')
    })
  })

  describe('Advanced fields', () => {
    it('Should render the advanced toggle for non-lair types, collapsed by default', async () => {
      const component = await mountWithForm('npc')
      const toggle = component.find('[test-id="advanced-toggle"]')
      const content = component.find('[test-id="advanced-content"]')

      expect(toggle.exists()).toBeTruthy()
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(content.exists()).toBeTruthy()
      expect(isHidden(content.element as HTMLElement)).toBeTruthy()
    })

    it('Should not render the advanced toggle for lair type', async () => {
      const component = await mountWithForm('lair')

      expect(component.find('[test-id="advanced-toggle"]').exists()).toBeFalsy()
      expect(
        component.find('[test-id="advanced-content"]').exists(),
      ).toBeFalsy()
    })

    it('Should reveal all advanced fields when the toggle is clicked', async () => {
      const component = await mountWithForm('npc')
      const toggle = component.find('[test-id="advanced-toggle"]')

      await toggle.trigger('click')
      await nextTick()

      const content = component.find('[test-id="advanced-content"]')
      expect(isHidden(content.element as HTMLElement)).toBeFalsy()
      expect(toggle.attributes('aria-expanded')).toBe('true')

      const html = component.html()

      expect(html).toContain('components.inputs.hitDiceLabel')
      expect(html).toContain('components.inputs.armorDetailLabel')
      expect(html).toContain('general.proficiencyBonus')
      expect(html).toContain('general.passivePerception')
      expect(html).toContain('general.speed')
      expect(html).toContain('general.sense')
      expect(html).toContain('general.language')
    })

    it('Should hide the advanced fields again when the toggle is clicked twice', async () => {
      vi.useFakeTimers()

      const component = await mountWithForm('npc')
      const toggle = component.find('[test-id="advanced-toggle"]')

      await toggle.trigger('click')
      await vi.advanceTimersByTimeAsync(50)
      await toggle.trigger('click')
      await vi.advanceTimersByTimeAsync(500)

      const content = component.find('[test-id="advanced-content"]')

      expect(isHidden(content.element as HTMLElement)).toBeTruthy()
      expect(toggle.attributes('aria-expanded')).toBe('false')

      vi.useRealTimers()
    })
  })
})
