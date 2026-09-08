import type { Marked } from 'marked'
import type { HtmlSanitizer } from '~/utils/sanitize-html'

const renderer = shallowRef<{ marked: Marked; sanitize: HtmlSanitizer }>()
let pending: Promise<void> | undefined

export function useMarkdown() {
  if (import.meta.client && !renderer.value && !pending) {
    pending = Promise.all([import('marked'), loadMarkdownSanitizer()]).then(
      ([{ Marked }, sanitize]) => {
        renderer.value = { marked: new Marked(), sanitize }
      },
    )
  }

  return {
    renderMarkdown: (text: string) => {
      if (!renderer.value) return ''

      const { marked, sanitize } = renderer.value

      return sanitize(marked.parse(text, { async: false }))
    },
  }
}
