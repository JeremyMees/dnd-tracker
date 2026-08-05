import { flushPromises } from '@vue/test-utils'

interface FormWrapper {
  get: (selector: string) => {
    setValue: (value: string | number) => Promise<void>
    trigger: (event: string) => Promise<void>
  }
}

async function settle(ticks = 6): Promise<void> {
  for (let tick = 0; tick < ticks; tick++) {
    await new Promise(resolve => setTimeout(resolve))
    await flushPromises()
  }
}

export async function fillForm(
  component: FormWrapper,
  values: Record<string, string | number>,
): Promise<void> {
  for (const [field, value] of Object.entries(values)) {
    await component.get(`[data-test-${field}]`).setValue(value)
  }

  await flushPromises()
}

export async function submitForm(
  component: FormWrapper,
  selector = 'form',
): Promise<void> {
  await component.get(selector).trigger('submit')

  await settle()
}
