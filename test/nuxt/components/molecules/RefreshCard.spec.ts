import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import RefreshCard from '~/components/molecules/RefreshCard'

describe('RefreshCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(RefreshCard)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should be emit refresh event', async () => {
    const component = await mountSuspended(RefreshCard)
    const button = component.find('[data-test-refresh-button]')

    expect(button.exists()).toBeTruthy()

    await button.trigger('click')
    await nextTick()

    expect(component.emitted('refresh')).toBeTruthy()
  })
})
