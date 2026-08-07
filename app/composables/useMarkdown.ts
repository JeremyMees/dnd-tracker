import type { MarkdownIt } from 'markdown-it'

const renderer = shallowRef<MarkdownIt>()
let pending: Promise<void> | undefined

export function useMarkdown() {
  if (import.meta.client && !renderer.value && !pending) {
    pending = import('markdown-it').then(({ default: md }) => {
      renderer.value = md()
    })
  }

  return {
    renderMarkdown: (text: string) => renderer.value?.render(text) ?? '',
  }
}
