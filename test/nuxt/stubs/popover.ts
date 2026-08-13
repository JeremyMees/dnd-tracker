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
  value: string,
  name = 'SelectRoot',
): Promise<void> {
  component.findComponent({ name }).vm.$emit('update:modelValue', value)
  await flushPromises()
}
