import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AvatarPicker from '~/components/atoms/AvatarPicker'
import type { AvatarVariants } from '~/components/ui/avatar'
import type { Avatar } from '~/composables/useAvatar'
import { defaultAvatar } from '~~/constants/default-avatar'

interface Props {
  profile?: boolean
  deprecatedAvatar?: boolean
  hideCreatorToggle?: boolean
  size?: AvatarVariants['size']
  modelValue?: Avatar
}

const props: Props = {
  size: 'lg',
  modelValue: defaultAvatar,
}

const avatarSizes: Record<'xs' | 'sm' | 'base' | 'lg', string> = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  base: 'h-12 w-12',
  lg: 'h-32 w-32',
}

describe('AvatarPicker', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(AvatarPicker, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render avatar with default props correctly', async () => {
    const component = await mountSuspended(AvatarPicker, { props, modalValue: defaultAvatar })

    const avatar = component.find('[data-test-avatar]')
    expect(avatar.exists()).toBeTruthy()
    expect(avatar.attributes('class')).toContain(avatarSizes.lg)

    const randomButton = component.find('button[aria-label="actions.random"]')
    expect(randomButton.exists()).toBeTruthy()

    const optionsButton = component.find('button[aria-label="components.avatarPicker.options"]')
    expect(optionsButton.exists()).toBeTruthy()

    expect(component.find('[data-test-deprecated]').exists()).toBeFalsy()
    expect(component.find('[data-test-creator]').exists()).toBeFalsy()
  })

  it('Should show deprecated message when user has an old avatar', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, deprecatedAvatar: true },
    })

    const deprecatedMessage = component.find('[data-test-deprecated]')
    expect(deprecatedMessage.exists()).toBeTruthy()
    expect(deprecatedMessage.text()).toContain('components.avatarPicker.deprecated')
  })

  it('Should have creator open by default', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, hideCreatorToggle: true },
    })

    const optionsButton = component.find('button[aria-label="components.avatarPicker.options"]')
    expect(optionsButton.exists()).toBeFalsy()

    expect(component.find('[data-test-creator]').exists()).toBeTruthy()
  })

  it('Should apply correct size', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, size: 'xs' },
    })

    expect(component.find('[data-test-avatar]').attributes('class')).toContain(avatarSizes.xs)

    component.setProps({ size: 'sm' })
    await nextTick()
    expect(component.find('[data-test-avatar]').attributes('class')).toContain(avatarSizes.sm)

    component.setProps({ size: 'base' })
    await nextTick()
    expect(component.find('[data-test-avatar]').attributes('class')).toContain(avatarSizes.base)
  })
})
