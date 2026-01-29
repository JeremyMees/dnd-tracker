import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardArmor from '~/components/molecules/ContentCard/ContentCardArmor'
import { open5eArmorFixture } from '~~/test/unit/fixtures/open5e'

interface Props {
  content: Open5eArmor
}

const props: Props = {
  content: open5eArmorFixture,
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
})
