import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCard from '~/components/molecules/ContentCard'
import hit from '~~/test/unit/fixtures/open5e-item.json'

interface Props {
  hit: Open5eItem
  type: Open5eType
  pinned?: boolean
  allowPin?: boolean
  variant?: 'secondary' | 'background'
}

const props: Props = {
  hit: hit as unknown as Open5eItem,
  type: 'monsters',
  allowPin: false,
  pinned: false,
  variant: 'secondary',
}

describe('ContentCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(ContentCard, { props })

    expect(component.find('[data-test-pin]').exists()).toBeFalsy()
    expect(component.find('[data-test-title]').text()).toBe(hit.name)
  })

  it('Should show pin button when allowPin is true', async () => {
    const component = await mountSuspended(ContentCard, { props: { ...props, allowPin: true } })
    const pin = component.find('[data-test-pin]')

    expect(pin.exists()).toBeTruthy()
  })

  it('Should be possible to pin and unpin', async () => {
    const component = await mountSuspended(ContentCard, { props: { ...props, allowPin: true } })
    const pin = component.find('[data-test-pin]')

    expect(pin.exists()).toBeTruthy()
    expect(pin.attributes('aria-label')).toBe('components.infoCard.add')

    await pin.trigger('click')
    await nextTick()

    expect(component.emitted('pin')).toBeTruthy()

    await component.setProps({ pinned: true })
    await nextTick()

    expect(pin.attributes('aria-label')).toBe('components.infoCard.remove')

    await pin.trigger('click')
    await nextTick()

    expect(component.emitted('unpin')).toBeTruthy()

    await component.setProps({ pinned: false })
    await nextTick()

    expect(pin.attributes('aria-label')).toBe('components.infoCard.add')
  })
})
