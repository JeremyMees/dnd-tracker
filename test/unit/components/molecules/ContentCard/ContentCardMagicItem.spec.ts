import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardMagicItem from '~/components/molecules/ContentCard/ContentCardMagicItem'
import { open5eMagicItemFixture } from '~~/test/unit/fixtures/open5e'

interface Props {
  content: Open5eMagicItem
  isOpen: boolean
}

const props: Props = {
  content: open5eMagicItemFixture,
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
    expect(component.find('[data-test-separator]').exists()).toBeFalsy()
  })

  it('Should render expanded when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardMagicItem, { props: { ...props, isOpen: true } })

    expect(component.find('[data-test-separator]').exists()).toBeTruthy()
    expect(component.text()).toContain('Rarity: Uncommon')
    expect(component.text()).toContain('Requires Attunement: No')
  })
})
