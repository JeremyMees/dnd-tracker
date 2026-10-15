import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { FileInput } from '~/components/ui/input'
import { selectFile } from '~~/test/nuxt/stubs/form'

const file = new File(['image'], 'bug.png', { type: 'image/png' })

describe('FileInput', () => {
  it('renders a file input', async () => {
    const component = await mountSuspended(FileInput)

    expect(component.get('input').attributes('type')).toBe('file')
  })

  it('emits the selected file', async () => {
    const component = await mountSuspended(FileInput)

    await selectFile(component, 'input', file)

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(file)
  })

  it('emits undefined when the selection is cleared', async () => {
    const component = await mountSuspended(FileInput)

    await selectFile(component, 'input', null)

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toBeUndefined()
  })

  it('keeps the selected file when it re-renders', async () => {
    const setValue = vi.fn()
    const component = await mountSuspended(FileInput)

    Object.defineProperty(component.get('input').element, 'value', {
      get: () => 'C:\\fakepath\\bug.png',
      set: setValue,
      configurable: true,
    })
    await component.setProps({ modelValue: file })

    expect(setValue).not.toHaveBeenCalled()
  })

  it('strips vee-validate native onInput/onChange so they cannot receive the raw event', async () => {
    const onInput = vi.fn()
    const onChange = vi.fn()

    const component = await mountSuspended(FileInput, {
      attrs: { onInput, onChange },
    })

    await selectFile(component, 'input', file)

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(file)
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('forwards attributes and merges classes', async () => {
    const component = await mountSuspended(FileInput, {
      props: { class: 'h-auto' },
      attrs: { accept: 'image/png', 'test-id': 'upload' },
    })

    const input = component.get('input')

    expect(input.attributes('accept')).toBe('image/png')
    expect(input.attributes('test-id')).toBe('upload')
    expect(input.classes()).toContain('h-auto')
  })
})
