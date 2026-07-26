import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { Input } from '~/components/ui/input'

describe('Input', () => {
  it('emits a number for number inputs', async () => {
    const component = await mountSuspended(Input, {
      props: { type: 'number' },
    })

    await component.get('input').setValue('25')

    const emitted = component.emitted('update:modelValue')
    expect(emitted?.[0]?.[0]).toBe(25)
  })

  it('rounds nothing but keeps floats as numbers for number inputs', async () => {
    const component = await mountSuspended(Input, {
      props: { type: 'number' },
    })

    await component.get('input').setValue('12.5')

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toBe(12.5)
  })

  it('emits undefined when a number input is cleared', async () => {
    const component = await mountSuspended(Input, {
      props: { type: 'number' },
    })

    await component.get('input').setValue('')

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toBeUndefined()
  })

  it('emits a string for text inputs', async () => {
    const component = await mountSuspended(Input, {
      props: { type: 'text' },
    })

    await component.get('input').setValue('hello')

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toBe('hello')
  })

  it('strips vee-validate native onInput/onChange so they cannot clobber the coerced value', async () => {
    const onInput = vi.fn()
    const onChange = vi.fn()

    const component = await mountSuspended(Input, {
      props: { type: 'number' },
      attrs: { onInput, onChange },
    })

    await component.get('input').setValue('25')

    expect(component.emitted('update:modelValue')?.[0]?.[0]).toBe(25)
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })
})
