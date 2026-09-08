import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import MarkdownText from '~/components/atoms/MarkdownText.vue'

let component: Awaited<ReturnType<typeof mountSuspended>> | undefined

afterEach(() => {
  component?.unmount()
  component = undefined
})

describe('MarkdownText', () => {
  it('Should render the rendered markup as HTML', async () => {
    component = await mountSuspended(MarkdownText, {
      props: { text: '<strong>bold</strong>' },
    })

    expect(component.html()).toContain('<strong>bold</strong>')
  })

  it('Should re-render when the text prop changes', async () => {
    component = await mountSuspended(MarkdownText, {
      props: { text: '<strong>bold</strong>' },
    })

    component.setProps({ text: '<em>italic</em>' })
    await nextTick()

    expect(component.html()).toContain('<em>italic</em>')
    expect(component.html()).not.toContain('<strong>bold</strong>')
  })

  it('Should render nothing for empty text', async () => {
    component = await mountSuspended(MarkdownText, { props: { text: '' } })

    expect(component.find('div').text()).toBe('')
  })

  it('Should forward attributes to the root element', async () => {
    component = await mountSuspended(MarkdownText, {
      props: { text: 'plain' },
      attrs: { class: 'md-richtext', 'test-id': 'desc' },
    })

    const root = component.find('[test-id="desc"]')

    expect(root.exists()).toBeTruthy()
    expect(root.classes()).toContain('md-richtext')
  })
})
