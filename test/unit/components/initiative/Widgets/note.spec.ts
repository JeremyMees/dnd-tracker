import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Note from '~/components/initiative/Widgets/Note.vue'

interface Props { value: string }

const props: Props = { value: 'Test note' }

let component: VueWrapper<InstanceType<typeof Note>>

describe('Initiative note widget', async () => {
  afterEach(() => {
    component?.unmount()
  })

  it('Should match snapshot', async () => {
    component = await mountSuspended(Note, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should emit update after debounce when text changes', async () => {
    component = await mountSuspended(Note, { props })
    const textEditor = component.findComponent({ name: 'TextEditor' })

    // Simulate text update
    await textEditor.vm.$emit('updated', 'New note content')

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(component.emitted('update')).toBeTruthy()
    expect(component.emitted('update')?.[0]).toEqual(['New note content'])
  })

  it('Should initialize with provided value', async () => {
    component = await mountSuspended(Note, { props })
    const textEditor = component.findComponent({ name: 'TextEditor' })

    expect(textEditor.props('content')).toBe('Test note')
  })
})
