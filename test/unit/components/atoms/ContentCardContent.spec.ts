import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import ContentCardContent from '~/components/atoms/ContentCardContent'
import open5eItem from '~~/test/unit/fixtures/open5e-item.json'

interface Props {
  content: Open5eItem
  isOpen: boolean
  hideOpenButton: () => boolean
  type: Open5eType
}

const baseContent: Open5eItem = open5eItem

const props: Props = {
  content: baseContent,
  isOpen: false,
  hideOpenButton: () => false,
  type: 'monsters',
}

describe('ContentCardContent', () => {
  it('Should render correctly with default props', async () => {
    const component = await mountSuspended(ContentCardContent, { props })

    expect(component.html()).toMatchSnapshot()
  })

  describe('Description', () => {
    it('Should render description when content.desc is provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test description' },
        },
      })

      expect(component.find('.md-richtext').exists()).toBeTruthy()
    })

    it('Should apply line-clamp-3 class when not open and hideOpenButton returns true', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test description' },
          isOpen: false,
          hideOpenButton: () => true,
        },
      })

      expect(component.find('.md-richtext').classes()).toContain('line-clamp-3')
    })

    it('Should not apply line-clamp-3 class when open', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test description' },
          isOpen: true,
          hideOpenButton: () => true,
        },
      })

      expect(component.find('.md-richtext').classes()).not.toContain('line-clamp-3')
    })
  })

  describe('Separator', () => {
    it('Should show separator when isOpen and type is spells', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test' },
          isOpen: true,
          type: 'spells',
        },
      })

      expect(component.find('[data-test-separator]').exists()).toBeTruthy()
    })

    it('Should show separator when isOpen and type is magicitems', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test' },
          isOpen: true,
          type: 'magicitems',
        },
      })

      expect(component.find('[data-test-separator]').exists()).toBeTruthy()
    })

    it('Should not show separator when type is monsters', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, desc: 'Test' },
          isOpen: true,
          type: 'monsters',
        },
      })

      expect(component.find('[data-test-separator]').exists()).toBeFalsy()
    })
  })

  describe('Content fields visibility', () => {
    it('Should show content fields when isOpen is true', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: {
            ...baseContent,
            category: 'Test Category',
            type: 'Test Type',
          },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Category:')
      expect(component.text()).toContain('Test Category')
      expect(component.text()).toContain('Type:')
      expect(component.text()).toContain('Test Type')
    })

    it('Should show content fields when hideOpenButton returns true', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: {
            ...baseContent,
            category: 'Test Category',
          },
          isOpen: false,
          hideOpenButton: () => true,
        },
      })

      expect(component.text()).toContain('Category:')
      expect(component.text()).toContain('Test Category')
    })

    it('Should not show content fields when isOpen is false and hideOpenButton returns false', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: {
            ...baseContent,
            category: 'Test Category',
          },
          isOpen: false,
          hideOpenButton: () => false,
        },
      })

      expect(component.text()).not.toContain('Category:')
    })
  })

  describe('Content fields rendering', () => {
    it.each([
      // Armor fields
      ['ac_string', '15 (leather armor)', 'AC:', '15 (leather armor)'],
      ['strength_requirement', '13', 'Strength requirement:', '13'],
      // Weapon fields
      ['cost', '25 gp', 'Cost:', '25 gp'],
      ['damage_dice', '1d8', 'Damage dice:', '1d8'],
      ['damage_type', 'slashing', 'Damage type:', 'slashing'],
      ['weight', '3 lb', 'Weight:', '3 lb'],
      // Magic item fields
      ['rarity', 'Rare', 'Rarity:', 'Rare'],
      // Background fields
      ['skill_proficiencies', 'Athletics, Survival', 'Skill proficiencies:', 'Athletics, Survival'],
      ['tool_proficiencies', 'Thieves tools', 'Tool proficiencies:', 'Thieves tools'],
      ['languages', 'Common, Elvish', 'Languages:', 'Common, Elvish'],
      ['equipment', 'A backpack, bedroll', 'Equipment:', 'A backpack, bedroll'],
      ['feature_desc', 'You have an excellent memory for maps and geography.', null, 'You have an excellent memory for maps and geography.'],
      // Spell fields
      ['level', '3rd', 'Level:', '3rd'],
      ['higher_level', 'When you cast this spell using a higher level slot...', 'Higher level:', 'When you cast this spell using a higher level slot...'],
      ['casting_time', '1 action', 'Casting time:', '1 action'],
      ['range', '60 feet', 'Range:', '60 feet'],
      ['duration', 'Concentration, up to 1 minute', 'Duration:', 'Concentration, up to 1 minute'],
      ['concentration', 'Yes', 'Concentration:', 'Yes'],
      ['components', 'V, S, M', 'Components:', 'V, S, M'],
      ['material', 'a pinch of sulfur', 'Material:', 'a pinch of sulfur'],
      ['school', 'Evocation', 'School:', 'Evocation'],
      ['dnd_class', 'Wizard, Sorcerer', 'Classes that can use this spell:', 'Wizard, Sorcerer'],
      // Other fields
      ['category', 'Test Category', 'Category:', 'Test Category'],
      ['type', 'Test Type', 'Type:', 'Test Type'],
    ])('Should display %s when provided', async (field, value, label, expectedText) => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, [field]: value },
          isOpen: true,
        },
      })

      if (label) {
        expect(component.text()).toContain(label)
      }
      expect(component.text()).toContain(expectedText)
    })

    it('Should display stealth disadvantage when stealth_disadvantage is true', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, stealth_disadvantage: true },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Stealth disadvantage')
    })

    it('Should display requires attunement when requires_attunement is true', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, requires_attunement: true },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Requires attunement')
    })

    it('Should display properties list when provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, properties: ['Versatile', 'Finesse'] },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Properties')
      expect(component.text()).toContain('Versatile')
      expect(component.text()).toContain('Finesse')
    })

    it('Should display feature and feature_desc when provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: {
            ...baseContent,
            feature: 'Wanderer',
            feature_desc: 'You have an excellent memory for maps and geography.',
          },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Wanderer')
      expect(component.text()).toContain('You have an excellent memory for maps and geography.')
    })

    it('Should display ritual with additional text when provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, ritual: 'Yes' },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Ritual:')
      expect(component.text()).toContain('Yes')
      expect(component.text()).toContain('can be cast as ritual')
    })

    it('Should display prerequisite when provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, prerequisite: 'Strength 13 or higher' },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Prerequisite')
      expect(component.text()).toContain('Strength 13 or higher')
    })

    it('Should display effects_desc list when provided', async () => {
      const component = await mountSuspended(ContentCardContent, {
        props: {
          ...props,
          content: { ...baseContent, effects_desc: ['Effect 1', 'Effect 2'] },
          isOpen: true,
        },
      })

      expect(component.text()).toContain('Effects')
      expect(component.text()).toContain('Effect 1')
      expect(component.text()).toContain('Effect 2')
    })
  })
})
