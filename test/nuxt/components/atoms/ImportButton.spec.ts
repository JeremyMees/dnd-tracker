import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImportButton from '~/components/atoms/ImportButton.vue'

let mounted: VueWrapper | undefined

async function mountButton(props: Record<string, unknown> = {}) {
  mounted = await mountSuspended(ImportButton, { props })

  return mounted
}

function selectFile(component: VueWrapper, file?: File) {
  const input = component.find('[test-id="import-input"]')
  const element = input.element as HTMLInputElement

  Object.defineProperty(element, 'files', {
    value: file ? [file] : [],
    configurable: true,
  })

  return input.trigger('change')
}

describe('ImportButton', () => {
  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should show a skeleton while loading', async () => {
    const component = await mountButton({ loading: true })

    expect(component.find('[test-id="skeleton"]').exists()).toBeTruthy()
    expect(component.find('[test-id="import"]').exists()).toBeFalsy()
  })

  it('Should open the file picker when clicked', async () => {
    const component = await mountButton()
    const input = component.find('[test-id="import-input"]')
    const click = vi.spyOn(input.element as HTMLInputElement, 'click')

    await component.find('[test-id="import"]').trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('Should only accept json files by default', async () => {
    const component = await mountButton()

    expect(
      component.find('[test-id="import-input"]').attributes('accept'),
    ).toBe('application/json,.json')
  })

  it('Should accept the given file types', async () => {
    const component = await mountButton({ accept: '.txt' })

    expect(
      component.find('[test-id="import-input"]').attributes('accept'),
    ).toBe('.txt')
  })

  it('Should emit the picked file', async () => {
    const component = await mountButton()
    const file = new File(['{}'], 'export.json')

    await selectFile(component, file)

    expect(component.emitted('import')).toEqual([[file]])
  })

  it('Should not emit when nothing is picked', async () => {
    const component = await mountButton()

    await selectFile(component)

    expect(component.emitted('import')).toBeUndefined()
  })

  it('Should disable the button', async () => {
    const component = await mountButton({ disabled: true })

    expect(
      component.find('[test-id="import"]').attributes('disabled'),
    ).toBeDefined()
  })
})
