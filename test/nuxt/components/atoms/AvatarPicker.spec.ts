import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import AvatarPicker from '~/components/atoms/AvatarPicker.vue'
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

interface AvatarPickerVM {
  avatar?: Avatar
  isChanged: boolean
  avatarCreator: {
    avatar: { value?: Avatar }
  }
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

const singleColorAvatar: Avatar = {
  url: 'data:image/svg+xml,initial',
  extra: { clothingColor: 'fdea6b' },
}

describe('AvatarPicker', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(AvatarPicker, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render avatar with default props correctly', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props,
      modalValue: defaultAvatar,
    })

    const avatar = component.find('[test-id="avatar"]')
    expect(avatar.exists()).toBeTruthy()
    expect(avatar.attributes('class')).toContain(avatarSizes.lg)

    const randomButton = component.find('button[aria-label="actions.random"]')
    expect(randomButton.exists()).toBeTruthy()

    const optionsButton = component.find(
      'button[aria-label="components.avatarPicker.options"]',
    )
    expect(optionsButton.exists()).toBeTruthy()

    expect(component.find('[test-id="deprecated"]').exists()).toBeFalsy()
    expect(component.find('[test-id="creator"]').exists()).toBeFalsy()
  })

  it('Should show deprecated message when user has an old avatar', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, deprecatedAvatar: true },
    })

    const deprecatedMessage = component.find('[test-id="deprecated"]')
    expect(deprecatedMessage.exists()).toBeTruthy()
    expect(deprecatedMessage.text()).toContain(
      'components.avatarPicker.deprecated',
    )
  })

  it('Should have creator open by default', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, hideCreatorToggle: true },
    })

    const optionsButton = component.find(
      'button[aria-label="components.avatarPicker.options"]',
    )
    expect(optionsButton.exists()).toBeFalsy()

    expect(component.find('[test-id="creator"]').exists()).toBeTruthy()
  })

  it('Should apply correct size', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, size: 'xs' },
    })

    expect(component.find('[test-id="avatar"]').attributes('class')).toContain(
      avatarSizes.xs,
    )

    component.setProps({ size: 'sm' })
    await nextTick()
    expect(component.find('[test-id="avatar"]').attributes('class')).toContain(
      avatarSizes.sm,
    )

    component.setProps({ size: 'base' })
    await nextTick()
    expect(component.find('[test-id="avatar"]').attributes('class')).toContain(
      avatarSizes.base,
    )
  })

  it('Should generate a random avatar on mount when no model value is given', async () => {
    const component = await mountSuspended(AvatarPicker, { props: {} })
    const vm = component.vm as unknown as AvatarPickerVM

    expect(vm.avatarCreator.avatar.value).toBeDefined()
    expect(component.emitted('update:modelValue')).toBeTruthy()
  })

  it('Should call avatarCreator.random when the random button is clicked', async () => {
    const component = await mountSuspended(AvatarPicker, { props })
    const vm = component.vm as unknown as AvatarPickerVM & {
      avatarCreator: { random: () => void }
    }
    const randomSpy = vi.spyOn(vm.avatarCreator, 'random')

    await component.get('button[aria-label="actions.random"]').trigger('click')

    expect(randomSpy).toHaveBeenCalledOnce()
  })

  it('Should toggle the creator open and closed when the options button is clicked', async () => {
    const component = await mountSuspended(AvatarPicker, { props })

    expect(component.find('[test-id="creator"]').exists()).toBeFalsy()

    await component
      .get('button[aria-label="components.avatarPicker.options"]')
      .trigger('click')

    expect(component.find('[test-id="creator"]').exists()).toBeTruthy()

    await component
      .get('button[aria-label="components.avatarPicker.options"]')
      .trigger('click')

    expect(component.find('[test-id="creator"]').exists()).toBeFalsy()
  })

  it('Should update the avatar when a style selector emits an update', async () => {
    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, modelValue: singleColorAvatar },
    })
    const vm = component.vm as unknown as AvatarPickerVM

    await component
      .get('button[aria-label="components.avatarPicker.options"]')
      .trigger('click')

    const initialUrl = vm.avatarCreator.avatar.value?.url

    await component.get('[test-id="creator"] [test-id="next"]').trigger('click')

    expect(vm.avatarCreator.avatar.value?.url).not.toBe(initialUrl)
    expect(component.emitted('update:modelValue')).toBeTruthy()
  })

  it('Should sync avatarCreator when the avatar model is updated externally', async () => {
    const component = await mountSuspended(AvatarPicker, { props })
    const vm = component.vm as unknown as AvatarPickerVM

    const newAvatar: Avatar = {
      url: 'external-url',
      extra: { clothingColor: 'ff0000' },
    }
    await component.setProps({ modelValue: newAvatar })
    await nextTick()

    expect(vm.avatarCreator.avatar.value?.url).toBe('external-url')
  })

  it('Should fall back to a JSON comparison for isChanged when extra options are missing', async () => {
    const noExtraAvatar = {
      url: 'test-url',
      extra: undefined,
    } as unknown as Avatar

    const component = await mountSuspended(AvatarPicker, {
      props: { ...props, profile: true, modelValue: noExtraAvatar },
    })
    const vm = component.vm as unknown as AvatarPickerVM

    expect(vm.isChanged).toBeFalsy()

    await component
      .get('button[aria-label="components.avatarPicker.options"]')
      .trigger('click')
    await component.get('[test-id="creator"] [test-id="next"]').trigger('click')

    expect(vm.isChanged).toBeTruthy()
  })

  describe('profile save/reset flow', () => {
    it('Should show the save and reset buttons once a style is changed', async () => {
      const component = await mountSuspended(AvatarPicker, {
        props: { ...props, profile: true, modelValue: singleColorAvatar },
      })

      expect(
        component.find('button[aria-label="actions.save"]').exists(),
      ).toBeFalsy()
      expect(
        component.find('button[aria-label="actions.reset"]').exists(),
      ).toBeFalsy()

      await component
        .get('button[aria-label="components.avatarPicker.options"]')
        .trigger('click')
      await component
        .get('[test-id="creator"] [test-id="next"]')
        .trigger('click')

      expect(
        component.find('button[aria-label="actions.save"]').exists(),
      ).toBeTruthy()
      expect(
        component.find('button[aria-label="actions.reset"]').exists(),
      ).toBeTruthy()
    })

    it('Should emit save and close the creator when the save button is clicked', async () => {
      const component = await mountSuspended(AvatarPicker, {
        props: { ...props, profile: true, modelValue: singleColorAvatar },
      })
      const vm = component.vm as unknown as AvatarPickerVM

      await component
        .get('button[aria-label="components.avatarPicker.options"]')
        .trigger('click')
      await component
        .get('[test-id="creator"] [test-id="next"]')
        .trigger('click')
      await component.get('button[aria-label="actions.save"]').trigger('click')

      expect(component.emitted('save')).toBeTruthy()
      expect(vm.avatarCreator.avatar.value).toBeDefined()
      expect(component.find('[test-id="creator"]').exists()).toBeFalsy()
    })

    it('Should reset the avatar to its initial value when the reset button is clicked', async () => {
      const component = await mountSuspended(AvatarPicker, {
        props: { ...props, profile: true, modelValue: singleColorAvatar },
      })
      const vm = component.vm as unknown as AvatarPickerVM

      await component
        .get('button[aria-label="components.avatarPicker.options"]')
        .trigger('click')
      await component
        .get('[test-id="creator"] [test-id="next"]')
        .trigger('click')

      expect(vm.isChanged).toBeTruthy()

      await component.get('button[aria-label="actions.reset"]').trigger('click')

      const resetColor = vm.avatarCreator.avatar.value?.extra
        ?.clothingColor as string
      expect(resetColor.replace('#', '')).toBe(
        singleColorAvatar.extra?.clothingColor,
      )
      expect(component.find('[test-id="creator"]').exists()).toBeFalsy()
    })
  })
})
