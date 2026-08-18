import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PinnedContent from '~/components/initiative/Widgets/PinnedContent.vue'
import {
  dndSpellFixture,
  dndArmorFixture,
  dndWeaponFixture,
  dndMagicItemFixture,
} from '~~/test/fixtures/open5e'

interface Props {
  value: DndItem[]
}

const props: Props = {
  value: [dndSpellFixture, dndArmorFixture],
}

describe('Initiative pinned content widget', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(PinnedContent, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show empty state when no items', async () => {
    const component = await mountSuspended(PinnedContent, {
      props: { value: [] },
    })

    expect(component.html()).toMatchSnapshot()
    expect(component.text()).toContain(
      'pages.encounter.pinnedContent.empty.title',
    )
    expect(component.text()).toContain(
      'pages.encounter.pinnedContent.empty.text',
    )
  })

  it('Should show accordion when items are present', async () => {
    const component = await mountSuspended(PinnedContent, { props })

    expect(component.find('[test-id="accordion"]').exists()).toBeTruthy()
  })

  it.each([
    { fixture: dndSpellFixture, cardName: 'ContentCardSpell' },
    { fixture: dndArmorFixture, cardName: 'ContentCardArmor' },
    { fixture: dndWeaponFixture, cardName: 'ContentCardWeapon' },
    { fixture: dndMagicItemFixture, cardName: 'ContentCardMagicItem' },
  ])(
    'Should render $cardName when the matching item type is expanded',
    async ({ fixture, cardName }) => {
      const component = await mountSuspended(PinnedContent, {
        props: { value: [fixture] },
      })

      await component.get('button').trigger('click')

      expect(component.findComponent({ name: cardName }).exists()).toBeTruthy()
    },
  )

  it('Should emit update without the removed item when the remove button is clicked', async () => {
    const component = await mountSuspended(PinnedContent, { props })

    await component.findAll('button')[0]!.trigger('click')
    await component.get('[test-id="remove"]').trigger('click')

    expect(component.emitted('update')?.[0]).toEqual([
      props.value.filter(item => item.id !== dndSpellFixture.id),
    ])
  })
})
