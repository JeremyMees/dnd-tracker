import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AvatarSelector from '~/components/atoms/AvatarSelector.vue'

type Identifier =
  | 'backgroundColor'
  | 'accessoriesVariant'
  | 'clothingColor'
  | 'expressionVariant'
  | 'facialHairVariant'
  | 'headVariant'
  | 'color'

interface Props {
  identifier: Identifier
  options: string[]
  selected?: string | number
}

const identifiers: Record<Identifier, { label: string; icon: string }> = {
  backgroundColor: { label: 'backgroundColor', icon: 'tabler:background' },
  accessoriesVariant: { label: 'accessories', icon: 'tabler:eyeglass-2' },
  clothingColor: { label: 'clothingColor', icon: 'tabler:shirt' },
  expressionVariant: { label: 'face', icon: 'tabler:lego' },
  facialHairVariant: { label: 'facialHair', icon: 'tabler:moustache' },
  headVariant: { label: 'hair', icon: 'tabler:mood-boy' },
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

    const icon = component.find('[test-id="icon"]')
    expect(icon.exists()).toBeTruthy()
    expect(icon.attributes('class')).toContain(
      identifiers[props.identifier].icon,
    )

    const current = component.find('[test-id="current"]')
    expect(current.exists()).toBeTruthy()
    expect(current.text()).toBe(`1/${props.options.length}`)
  })

  it('Should go to next and previous options', async () => {
    const component = await mountSuspended(AvatarSelector, { props })

    const options = props.options.length
    const nextButton = component.find('[test-id="next"]')
    const prevButton = component.find('[test-id="prev"]')

    expect(component.find(`[test-id="current"]`).text()).toBe(`1/${options}`)

    await nextButton.trigger('click')
    let emitted = component.emitted('update')

    expect(emitted).toBeTruthy()

    component.setProps({ selected: emitted?.[0]?.[0] as string })
    await nextTick()

    expect(component.find(`[test-id="current"]`).text()).toBe(`2/${options}`)

    await nextButton.trigger('click')
    emitted = component.emitted('update')

    expect(emitted).toBeTruthy()

    component.setProps({ selected: emitted?.[1]?.[0] as string })
    await nextTick()

    expect(component.find(`[test-id="current"]`).text()).toBe(`1/${options}`)

    await prevButton.trigger('click')
    emitted = component.emitted('update')

    expect(emitted).toBeTruthy()
    component.setProps({ selected: emitted?.[2]?.[0] as string })

    await nextTick()

    expect(component.find(`[test-id="current"]`).text()).toBe(`2/${options}`)
  })

  it('Should wrap around to the last option when prev is clicked at the first option', async () => {
    const component = await mountSuspended(AvatarSelector, { props })

    await component.find('[test-id="prev"]').trigger('click')

    expect(component.emitted('update')).toEqual([[props.options[1]]])
  })

  it('Should go to the previous option without wrapping when not at the first option', async () => {
    const component = await mountSuspended(AvatarSelector, {
      props: { ...props, selected: props.options[1] },
    })

    await component.find('[test-id="prev"]').trigger('click')

    expect(component.emitted('update')).toEqual([[props.options[0]]])
  })

  it('Should fall back to a generic icon and the raw identifier as label for unknown identifiers', async () => {
    const component = await mountSuspended(AvatarSelector, {
      props: { ...props, identifier: 'unknownIdentifier' },
    })

    const icon = component.find('[test-id="icon"]')
    expect(icon.attributes('class')).toContain('tabler:palette')
  })

  it('Should not emit update when there are no options to select', async () => {
    const component = await mountSuspended(AvatarSelector, {
      props: { ...props, options: [] },
    })

    await component.find('[test-id="prev"]').trigger('click')
    await component.find('[test-id="next"]').trigger('click')

    expect(component.emitted('update')).toBeFalsy()
  })
})
