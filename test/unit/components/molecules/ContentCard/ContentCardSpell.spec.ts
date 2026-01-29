import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardSpell from '~/components/molecules/ContentCard/ContentCardSpell'
import { open5eSpellFixture } from '~~/test/unit/fixtures/open5e'

interface Props {
  content: Open5eSpell
  isOpen: boolean
}

const props: Props = {
  content: open5eSpellFixture,
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
    expect(component.find('[data-test-separator]').exists()).toBeFalsy()
    expect(component.text()).not.toContain('Level: 2')
  })

  it('Should render expanded when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardSpell, { props: { ...props, isOpen: true } })

    expect(component.find('[data-test-separator]').exists()).toBeTruthy()
    expect(component.text()).toContain('Level: 2')
    expect(component.text()).toContain('School: Evocation')
    expect(component.text()).toContain('Classes: Wizard')
  })
})
