import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'

export function dialogRoot(component: VueWrapper, name = 'DialogRoot') {
  return component.findComponent({ name })
}

export function dialogIsOpen(
  component: VueWrapper,
  name = 'DialogRoot',
): boolean {
  return dialogRoot(component, name).props('open') === true
}

export async function closeDialog(
  component: VueWrapper,
  name = 'DialogRoot',
): Promise<void> {
  dialogRoot(component, name).vm.$emit('update:open', false)
  await flushPromises()
}

export function inDialog(testId: string): HTMLElement | null {
  return document.body.querySelector(`[test-id="${testId}"]`)
}

export function dialogText(testId: string): string {
  return inDialog(testId)?.textContent ?? ''
}

export async function clickInDialog(testId: string): Promise<void> {
  inDialog(testId)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  await flushPromises()
}
