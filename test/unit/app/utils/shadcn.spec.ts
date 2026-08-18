import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { cn, valueUpdater } from '~/utils/shadcn'

describe('shadcn', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('drops falsy values', () => {
      expect(cn('px-2', false, undefined, null, 'py-1')).toBe('px-2 py-1')
    })

    it('resolves conflicting tailwind classes to the last one', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('valueUpdater', () => {
    it('assigns a direct value to the ref', () => {
      const target = ref(1)

      valueUpdater(2, target)

      expect(target.value).toBe(2)
    })

    it('calls the updater function with the current value', () => {
      const target = ref(1)

      valueUpdater<number>(old => old + 1, target)

      expect(target.value).toBe(2)
    })
  })
})
