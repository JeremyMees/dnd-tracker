import { describe, expect, it } from 'vitest'
import {
  isPlainKeyPress,
  isShortcutContext,
  isTypingTarget,
} from '~/utils/ui-helpers'

describe('ui-helpers in the browser', () => {
  describe('isTypingTarget', () => {
    it.each(['input', 'textarea', 'select'])('is true for a %s', tag => {
      expect(isTypingTarget(document.createElement(tag))).toBe(true)
    })

    it('is true for a contenteditable element', () => {
      const editor = document.createElement('div')
      editor.contentEditable = 'true'
      document.body.appendChild(editor)

      expect(isTypingTarget(editor)).toBe(true)

      editor.remove()
    })

    it('is false for other elements', () => {
      expect(isTypingTarget(document.createElement('button'))).toBe(false)
    })

    it('is false when there is no element', () => {
      expect(isTypingTarget(null)).toBe(false)
      expect(isTypingTarget(window)).toBe(false)
    })
  })

  describe('isPlainKeyPress', () => {
    function keydown(
      init: KeyboardEventInit = {},
      target: Element = document.body,
    ): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key: 'd', ...init })

      Object.defineProperty(event, 'target', { value: target })

      return event
    }

    it('is true for a bare key press', () => {
      expect(isPlainKeyPress(keydown())).toBe(true)
    })

    it('is true for a shifted key like a question mark', () => {
      expect(isPlainKeyPress(keydown({ key: '?', shiftKey: true }))).toBe(true)
    })

    it.each([
      { metaKey: true },
      { ctrlKey: true },
      { altKey: true },
      { repeat: true },
    ])('is false with %o', init => {
      expect(isPlainKeyPress(keydown(init))).toBe(false)
    })

    it('is false while typing', () => {
      expect(
        isPlainKeyPress(keydown({}, document.createElement('input'))),
      ).toBe(false)
    })

    it('is false inside a dialog', () => {
      const dialog = document.createElement('div')
      const button = document.createElement('button')

      dialog.setAttribute('role', 'dialog')
      dialog.appendChild(button)

      expect(isPlainKeyPress(keydown({}, button))).toBe(false)
    })
  })

  describe('isShortcutContext', () => {
    it('is true outside inputs and dialogs', () => {
      expect(isShortcutContext(document.body)).toBe(true)
      expect(isShortcutContext(null)).toBe(true)
    })

    it('is false while typing or inside a dialog', () => {
      const dialog = document.createElement('div')
      const button = document.createElement('button')

      dialog.setAttribute('role', 'dialog')
      dialog.appendChild(button)

      expect(isShortcutContext(document.createElement('textarea'))).toBe(false)
      expect(isShortcutContext(button)).toBe(false)
    })
  })
})
