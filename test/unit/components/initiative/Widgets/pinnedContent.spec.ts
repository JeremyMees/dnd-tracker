import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PinnedContent from '~/components/initiative/Widgets/PinnedContent'
import open5eItem from '~~/test/unit/fixtures/open5e-item.json'

interface Props { value: Open5eItem[] }

const props: Props = {
  value: [
    open5eItem as unknown as Open5eItem,
    open5eItem as unknown as Open5eItem,
  ],
}

describe('Initiative pinned content widget', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(PinnedContent, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show empty state when no items', async () => {
    const component = await mountSuspended(PinnedContent, { props: { value: [] } })

    expect(component.text()).toContain('pages.encounter.pinnedContent.empty')
  })

  it('Should show accordion when items are present', async () => {
    const component = await mountSuspended(PinnedContent, { props })

    expect(component.find('[data-test-accordion]').exists()).toBeTruthy()
  })
})
