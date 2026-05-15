import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AvatarSelector from '~/components/atoms/AvatarSelector.vue'

type Identifier = 'backgroundColor' | 'accessories' | 'clothingColor' | 'face' | 'facialHair' | 'head' | 'color'

interface Props {
  identifier: Identifier
  options: string[]
  selected?: string | number
}

const identifiers: Record<Identifier, { label: string, icon: string }> = {
  backgroundColor: { label: 'backgroundColor', icon: 'tabler:background' },
  accessories: { label: 'accessories', icon: 'tabler:eyeglass-2' },
  clothingColor: { label: 'clothingColor', icon: 'tabler:shirt' },
  face: { label: 'face', icon: 'tabler:lego' },
  facialHair: { label: 'facialHair', icon: 'tabler:moustache' },
  head: { label: 'head', icon: 'tabler:mood-boy' },
  color: { label: 'color', icon: 'tabler:palette' },
}

const props: Props = {
  identifier: 'backgroundColor',
  options: ['1', '2'],
}

describe('AvatarSelector', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(AvatarSelector, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render avatar with default props correctly', async () => {
    const component = await mountSuspended(AvatarSelector, { props })

    const icon = component.find('[data-test-icon]')
    expect(icon.exists()).toBeTruthy()
    expect(icon.attributes('class')).toContain(identifiers[props.identifier].icon)

    const current = component.find('[data-test-current]')
    expect(current.exists()).toBeTruthy()
    expect(current.text()).toBe(`1/${props.options.length}`)
  })

  it('Should go to next and previous options', async () => {
    const component = await mountSuspended(AvatarSelector, { props })

    const options = props.options.length
    const nextButton = component.find('[data-test-next]')
    const prevButton = component.find('[data-test-prev]')

    expect(component.find(`[data-test-current]`).text()).toBe(`1/${options}`)

    // First click on next, should go to option 2
    await nextButton.trigger('click')
    let emitted = component.emitted('update')
    expect(emitted).toBeTruthy()
    component.setProps({ selected: emitted?.[0]?.[0] as string })
    await nextTick()
    expect(component.find(`[data-test-current]`).text()).toBe(`2/${options}`)

    // Second click on next, should wrap around to option 1
    await nextButton.trigger('click')
    emitted = component.emitted('update')
    expect(emitted).toBeTruthy()
    component.setProps({ selected: emitted?.[1]?.[0] as string })
    await nextTick()
    expect(component.find(`[data-test-current]`).text()).toBe(`1/${options}`)

    // Click on prev, should go to option 2
    await prevButton.trigger('click')
    emitted = component.emitted('update')
    expect(emitted).toBeTruthy()
    component.setProps({ selected: emitted?.[2]?.[0] as string })
    await nextTick()
    expect(component.find(`[data-test-current]`).text()).toBe(`2/${options}`)
  })
})
