import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PinnedContent from '~/components/initiative/Widgets/PinnedContent.vue'
import { open5eSpellFixture, open5eArmorFixture } from '~~/test/nuxt/fixtures/open5e'

interface Props { value: Open5eItem[] }

const props: Props = {
  value: [
    open5eSpellFixture,
    open5eArmorFixture,
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
