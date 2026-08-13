import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { Editor } from '@tiptap/vue-3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TextEditor from '~/components/templates/TextEditor.vue'

interface TextEditorVM {
  editor?: Editor
  isOpen: boolean
  isFocused: boolean
  invalidHTML: boolean
  buttonStates: Record<string, boolean>
  characterStats: { characters: number; words: number }
}

const { sanitizeMock } = vi.hoisted(() => ({
  sanitizeMock: vi.fn((dirty: string) => dirty),
}))
mockNuxtImport('sanitizeClientHTML', () => sanitizeMock)

let component: VueWrapper<InstanceType<typeof TextEditor>>
const originalPrompt = window.prompt

function vm(): TextEditorVM {
  return component.vm as unknown as TextEditorVM
}

describe('TextEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(async () => {
    await vi.runOnlyPendingTimersAsync()
    component?.unmount()
    vi.clearAllTimers()
    vi.useRealTimers()
    sanitizeMock.mockReset()
    sanitizeMock.mockImplementation((dirty: string) => dirty)
  })

  it('Should match snapshot', async () => {
    component = await mountSuspended(TextEditor, {
      props: { content: '<p>Hello</p>' },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should initialize the editor with the provided content', async () => {
    component = await mountSuspended(TextEditor, {
      props: { content: '<p>Hello</p>' },
    })

    expect(vm().editor?.getHTML()).toBe('<p>Hello</p>')
  })

  it('Should apply the input variant styling by default', async () => {
    component = await mountSuspended(TextEditor, { props: {} })

    const classes = component.get('[test-id="editor"]').classes()
    expect(classes).toContain('border-input')
    expect(classes).toContain('bg-background')
  })

  it('Should apply the widget variant styling', async () => {
    component = await mountSuspended(TextEditor, {
      props: { variant: 'widget' },
    })

    const classes = component.get('[test-id="editor"]').classes()
    expect(classes).toContain('border-secondary')
    expect(classes).toContain('bg-secondary/50')
  })

  it('Should highlight the border when focused and remove it when blurred', async () => {
    component = await mountSuspended(TextEditor, { props: {} })
    const dom = component.get('.tiptap').element

    dom.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(component.get('[test-id="editor"]').classes()).toContain('ring-ring')

    dom.dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(component.get('[test-id="editor"]').classes()).not.toContain(
      'ring-ring',
    )
  })

  describe('Text style dropdown', () => {
    it('Should open the dropdown on mouseenter and close it on mouseleave', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      await component
        .get('[test-id="text-style-dropdown"]')
        .trigger('mouseenter')
      expect(vm().isOpen).toBe(true)
      expect(component.find('[test-id="dropdown-menu"]').exists()).toBe(true)

      await component.get('[test-id="dropdown-wrapper"]').trigger('mouseleave')
      expect(vm().isOpen).toBe(false)
    })

    it('Should open the dropdown when the trigger is clicked', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      await component.get('[test-id="text-style-dropdown"]').trigger('click')

      expect(vm().isOpen).toBe(true)
    })

    it('Should close the dropdown when escape is pressed', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      vm().isOpen = true
      await nextTick()

      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      await nextTick()

      expect(vm().isOpen).toBe(false)
    })

    it('Should close the dropdown when clicking outside of it', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      vm().isOpen = true
      await nextTick()

      document.body.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      )
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(vm().isOpen).toBe(false)
    })

    it('Should set the block to a paragraph and close the dropdown', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      vm().editor?.commands.toggleHeading({ level: 1 })
      vm().isOpen = true
      await nextTick()

      await component.get('[test-id="paragraph"]').trigger('click')

      expect(vm().editor?.isActive('paragraph')).toBe(true)
      expect(vm().isOpen).toBe(false)
    })

    it.each([1, 2, 3] as const)(
      'Should set heading level %s and close the dropdown',
      async level => {
        component = await mountSuspended(TextEditor, { props: {} })

        vm().isOpen = true
        await nextTick()

        await component.get(`[test-id="heading-${level}"]`).trigger('click')

        expect(vm().editor?.isActive('heading', { level })).toBe(true)
        expect(vm().isOpen).toBe(false)
      },
    )
  })

  describe('Formatting buttons', () => {
    it.each([
      ['bold', 'bold'],
      ['italic', 'italic'],
      ['strike', 'strike'],
      ['highlight', 'highlight'],
      ['bullet-list', 'bulletList'],
      ['ordered-list', 'orderedList'],
      ['blockquote', 'blockquote'],
    ])('Should toggle %s when clicked', async (testId, mark) => {
      component = await mountSuspended(TextEditor, { props: {} })

      await component.get(`[test-id="${testId}"]`).trigger('click')

      expect(vm().editor?.isActive(mark)).toBe(true)

      await component.get(`[test-id="${testId}"]`).trigger('click')

      expect(vm().editor?.isActive(mark)).toBe(false)
    })

    it('Should insert a horizontal rule when clicked', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      await component.get('[test-id="horizontal-rule"]').trigger('click')

      expect(vm().editor?.getHTML()).toContain('<hr')
    })

    it('Should clear formatting marks when clicked', async () => {
      component = await mountSuspended(TextEditor, { props: {} })

      vm().editor?.commands.insertContent('some text')
      vm().editor?.commands.selectAll()
      await component.get('[test-id="bold"]').trigger('click')
      expect(vm().editor?.isActive('bold')).toBe(true)

      await component.get('[test-id="clear-formatting"]').trigger('click')

      expect(vm().editor?.isActive('bold')).toBe(false)
    })

    it('Should support undoing and redoing content changes', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('hello')
      await nextTick()
      expect(vm().editor?.getHTML()).toContain('hello')

      vm().editor?.chain().focus().undo().run()
      expect(vm().editor?.getHTML()).not.toContain('hello')

      vm().editor?.chain().focus().redo().run()
      expect(vm().editor?.getHTML()).toContain('hello')
    })

    it('Should disable undo and redo when there is nothing to undo or redo', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      expect(
        component.get('[test-id="undo"]').attributes('disabled'),
      ).toBeDefined()
      expect(
        component.get('[test-id="redo"]').attributes('disabled'),
      ).toBeDefined()
    })
  })

  describe('Link handling', () => {
    afterEach(() => {
      window.prompt = originalPrompt
    })

    it('Should set a link when a url is provided', async () => {
      window.prompt = vi.fn().mockReturnValue('https://example.com')
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('link text')
      vm().editor?.commands.selectAll()
      await component.get('[test-id="link"]').trigger('click')

      expect(vm().editor?.getAttributes('link').href).toBe(
        'https://example.com',
      )
    })

    it('Should not change the link when the prompt is cancelled', async () => {
      window.prompt = vi.fn().mockReturnValue(null)
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('link text')
      vm().editor?.commands.selectAll()
      await component.get('[test-id="link"]').trigger('click')

      expect(vm().editor?.getAttributes('link').href).toBeUndefined()
    })

    it('Should unset the link when the prompt is submitted empty', async () => {
      const promptMock = vi.fn()
      window.prompt = promptMock
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('link text')
      vm().editor?.commands.selectAll()
      promptMock.mockReturnValue('https://example.com')
      await component.get('[test-id="link"]').trigger('click')
      expect(vm().editor?.isActive('link')).toBe(true)

      promptMock.mockReturnValue('')
      vm().editor?.commands.selectAll()
      await component.get('[test-id="link"]').trigger('click')

      expect(vm().editor?.isActive('link')).toBe(false)
    })

    it('Should unset the link when the unlink button is clicked', async () => {
      window.prompt = vi.fn().mockReturnValue('https://example.com')
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('link text')
      vm().editor?.commands.selectAll()
      await component.get('[test-id="link"]').trigger('click')
      expect(vm().editor?.isActive('link')).toBe(true)

      vm().editor?.chain().focus().unsetLink().run()

      expect(vm().editor?.isActive('link')).toBe(false)
    })
  })

  describe('Content updates', () => {
    it('Should emit updated with sanitized content after debounce', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('typed text')

      await vi.advanceTimersByTimeAsync(600)

      expect(component.emitted('updated')).toBeTruthy()
      const [emittedHtml] = component.emitted('updated')![0] as [string]
      expect(emittedHtml).toContain('typed text')
    })

    it('Should set invalidHTML and not emit when sanitizing changes the content', async () => {
      sanitizeMock.mockImplementation(() => '<p>different</p>')

      component = await mountSuspended(TextEditor, {
        props: { content: '<p></p>' },
      })

      vm().editor?.commands.insertContent('typed text')

      await vi.advanceTimersByTimeAsync(600)

      expect(vm().invalidHTML).toBe(true)
      expect(component.emitted('updated')).toBeFalsy()
    })
  })

  describe('Content prop watcher', () => {
    it('Should update the editor content when the prop changes and the editor is not focused', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p>Initial</p>' },
      })

      await component.setProps({ content: '<p>Updated</p>' })
      await vi.advanceTimersByTimeAsync(1100)

      expect(vm().editor?.getHTML()).toBe('<p>Updated</p>')
    })

    it('Should not update the editor content when the prop changes while focused', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p>Initial</p>' },
      })

      vm().isFocused = true
      await component.setProps({ content: '<p>Updated</p>' })
      await vi.advanceTimersByTimeAsync(1100)

      expect(vm().editor?.getHTML()).toBe('<p>Initial</p>')
    })
  })

  describe('Character stats', () => {
    it('Should render the character and word counts', async () => {
      component = await mountSuspended(TextEditor, {
        props: { content: '<p>Hello world</p>', charLimit: 100 },
      })

      expect(component.text()).toContain('11 / 100')
      expect(component.text()).toContain('2')
    })
  })

  it('Should destroy the editor on unmount', async () => {
    component = await mountSuspended(TextEditor, { props: {} })
    const destroySpy = vi.spyOn(vm().editor!, 'destroy')

    component.unmount()

    expect(destroySpy).toHaveBeenCalled()
  })
})
