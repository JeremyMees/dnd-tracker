import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'

export async function openPopover(
  component: VueWrapper,
  name = 'PopoverRoot',
): Promise<void> {
  component.findComponent({ name }).vm.$emit('update:open', true)
  await flushPromises()
}

export async function closePopover(
  component: VueWrapper,
  name = 'PopoverRoot',
): Promise<void> {
  component.findComponent({ name }).vm.$emit('update:open', false)
  await flushPromises()
}

export async function selectOption(
  component: VueWrapper,
  value: string | number | undefined,
  options: { name?: string; index?: number } = {},
): Promise<void> {
  const { name = 'SelectRoot', index = 0 } = options

  component
    .findAllComponents({ name })
    .at(index)!
    .vm.$emit('update:modelValue', value)
  await flushPromises()
}
