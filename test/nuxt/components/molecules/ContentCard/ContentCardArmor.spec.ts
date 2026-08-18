import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardArmor from '~/components/molecules/ContentCard/ContentCardArmor.vue'
import { dndArmorFixture } from '~~/test/fixtures/open5e'

interface Props {
  content: DndArmor
}

const props: Props = {
  content: dndArmorFixture,
}

describe('ContentCardArmor', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardArmor, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(ContentCardArmor, { props })

    expect(component.text()).toContain('Category: medium')
    expect(component.text()).toContain('Armor Class: 14 + Dex modifier (max 2)')
    expect(component.text()).toContain('Base AC: 14')
    expect(component.text()).not.toContain('Strength Required')
    expect(component.text()).toContain('Stealth Disadvantage: general.no')
  })

  it('Should hide optional fields when they are not present', async () => {
    const content = {
      ...dndArmorFixture,
      type: undefined,
      acDisplay: undefined,
      acBase: undefined,
      grantsStealthDisadvantage: undefined,
    } as unknown as DndArmor

    const component = await mountSuspended(ContentCardArmor, {
      props: { content },
    })

    expect(component.text()).not.toContain('Category')
    expect(component.text()).not.toContain('Armor Class')
    expect(component.text()).not.toContain('Base AC')
    expect(component.text()).not.toContain('Stealth Disadvantage')
  })

  it('Should show alternate optional field values when present', async () => {
    const content: DndArmor = {
      ...dndArmorFixture,
      strengthScoreRequired: 13,
      grantsStealthDisadvantage: true,
    }

    const component = await mountSuspended(ContentCardArmor, {
      props: { content },
    })

    expect(component.text()).toContain('Strength Required: 13')
    expect(component.text()).toContain('Stealth Disadvantage: general.yes')
  })
})
