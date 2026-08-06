import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { useForm } from 'vee-validate'
import type { Component } from 'vue'
import { vi } from 'vitest'

type UseFormOptions = NonNullable<Parameters<typeof useForm>[0]>

export interface FormMount {
  component: VueWrapper
  form: ReturnType<typeof useForm>
}

interface MountWithFormOptions {
  props?: Record<string, unknown>
  slots?: Record<string, (slotProps: Record<string, unknown>) => unknown>
  initialValues?: UseFormOptions['initialValues']
  validationSchema?: UseFormOptions['validationSchema']
  global?: Record<string, unknown>
}

interface FormWrapper {
  get: (selector: string) => {
    setValue: (value: string | number) => Promise<void>
    trigger: (event: string) => Promise<void>
  }
}

async function settle(ticks = 6): Promise<void> {
  for (let tick = 0; tick < ticks; tick++) {
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(1)
    else await new Promise(resolve => setTimeout(resolve))

    await flushPromises()
  }
}

export async function fillForm(
  component: FormWrapper,
  values: Record<string, string | number>,
): Promise<void> {
  for (const [field, value] of Object.entries(values)) {
    await component.get(`[test-id="${field}"]`).setValue(value)
  }

  await flushPromises()
}

export async function mountWithForm(
  component: Component,
  options: MountWithFormOptions = {},
): Promise<FormMount> {
  let form!: ReturnType<typeof useForm>

  const Wrapper = defineComponent({
    setup() {
      form = useForm({
        initialValues: options.initialValues,
        validationSchema: options.validationSchema,
      })

      return () => h(component, options.props, options.slots)
    },
  })

  const wrapper = await mountSuspended(Wrapper, { global: options.global })

  await flushPromises()

  return { component: wrapper, form }
}

export async function submitForm(
  component: FormWrapper,
  selector = 'form',
): Promise<void> {
  await component.get(selector).trigger('submit')

  await settle()
}
