import { describe, expect, it } from 'vitest'
import { isTypingTarget } from '~/utils/ui-helpers'

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
})
