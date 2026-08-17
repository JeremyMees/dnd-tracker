import type { Marked } from 'marked'

const renderer = shallowRef<Marked>()
let pending: Promise<void> | undefined

export function useMarkdown() {
  if (import.meta.client && !renderer.value && !pending) {
    pending = import('marked').then(({ Marked }) => {
      renderer.value = new Marked()
    })
  }

  return {
    renderMarkdown: (text: string) =>
      renderer.value?.parse(text, { async: false }) ?? '',
  }
}
