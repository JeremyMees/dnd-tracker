import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardMagicItem from '~/components/molecules/ContentCard/ContentCardMagicItem.vue'
import { dndMagicItemFixture } from '~~/test/fixtures/open5e'

interface Props {
  content: DndMagicItem
  isOpen: boolean
}

const props: Props = {
  content: dndMagicItemFixture,
  isOpen: false,
}

describe('ContentCardMagicItem', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardMagicItem, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props (collapsed)', async () => {
    const component = await mountSuspended(ContentCardMagicItem, { props })

    expect(component.text()).toContain('This suit of armor is reinforced')
    expect(component.find('[test-id="separator"]').exists()).toBeFalsy()
  })

  it('Should render expanded when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardMagicItem, {
      props: { ...props, isOpen: true },
    })

    expect(component.find('[test-id="separator"]').exists()).toBeTruthy()
    expect(component.text()).toContain('Rarity: Uncommon')
    expect(component.text()).toContain('Requires Attunement: No')
  })

  it('Should hide optional fields when they are not present', async () => {
    const content = {
      ...dndMagicItemFixture,
      desc: undefined,
      type: undefined,
      rarity: undefined,
      size: undefined,
      weight: undefined,
      cost: undefined,
      requiresAttunement: undefined,
      armor: {
        ...dndMagicItemFixture.armor,
        acBase: undefined,
        grantsStealthDisadvantage: undefined,
      },
    } as unknown as DndMagicItem

    const component = await mountSuspended(ContentCardMagicItem, {
      props: { content, isOpen: true },
    })

    expect(component.text()).not.toMatch(/(?<!Armor )Category:/)
    expect(component.text()).not.toContain('Rarity')
    expect(component.text()).not.toContain('Size')
    expect(component.text()).not.toContain('Weight')
    expect(component.text()).not.toContain('Cost')
    expect(component.text()).not.toContain('Requires Attunement')
    expect(component.text()).not.toContain('Base AC')
    expect(component.text()).not.toContain('Stealth Disadvantage')
  })

  it('Should show alternate optional field values when present', async () => {
    const content: DndMagicItem = {
      ...dndMagicItemFixture,
      requiresAttunement: true,
      attunementDetail: 'Only by a spellcaster',
      armor: {
        ...dndMagicItemFixture.armor!,
        grantsStealthDisadvantage: true,
        strengthScoreRequired: 13,
      },
    }

    const component = await mountSuspended(ContentCardMagicItem, {
      props: { content, isOpen: true },
    })

    expect(component.text()).toContain('Requires Attunement: Yes')
    expect(component.text()).toContain(
      'Attunement Detail: Only by a spellcaster',
    )
    expect(component.text()).toContain('Stealth Disadvantage: Yes')
    expect(component.text()).toContain('Strength Required: 13')
  })
})
