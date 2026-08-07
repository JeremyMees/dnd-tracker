import { describe, expect, it, vi } from 'vitest'

type UseMarkdownModule = typeof import('~/composables/useMarkdown')

async function loadUseMarkdown() {
  vi.resetModules()

  const { useMarkdown } = await vi.importActual<UseMarkdownModule>(
    '~/composables/useMarkdown',
  )

  return useMarkdown
}

describe('useMarkdown', () => {
  it('Should return an empty string before markdown-it is loaded', async () => {
    const useMarkdown = await loadUseMarkdown()
    const { renderMarkdown } = useMarkdown()

    expect(renderMarkdown('**bold**')).toBe('')
  })

  it('Should render markdown once markdown-it is loaded', async () => {
    const useMarkdown = await loadUseMarkdown()
    const { renderMarkdown } = useMarkdown()

    await vi.waitFor(() =>
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>'),
    )
  })

  it('Should render the list markup that condition descriptions rely on', async () => {
    const useMarkdown = await loadUseMarkdown()
    const { renderMarkdown } = useMarkdown()

    await vi.waitFor(() => expect(renderMarkdown('* one')).not.toBe(''))

    const html = renderMarkdown('Effects.\n * Can’t See. You can’t see.')

    expect(html).toContain('<p>Effects.</p>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>Can’t See. You can’t see.</li>')
  })

  it('Should re-render reactively when the renderer resolves', async () => {
    const useMarkdown = await loadUseMarkdown()
    const { renderMarkdown } = useMarkdown()

    const results: string[] = []
    const stop = watchEffect(() => results.push(renderMarkdown('**bold**')))

    expect(results).toEqual([''])

    await vi.waitFor(() => expect(results).toHaveLength(2))

    expect(results[1]).toContain('<strong>bold</strong>')

    stop()
  })

  it('Should reuse the cached renderer across calls', async () => {
    const useMarkdown = await loadUseMarkdown()
    const first = useMarkdown()

    await vi.waitFor(() => expect(first.renderMarkdown('**a**')).not.toBe(''))

    const second = useMarkdown()

    expect(second.renderMarkdown('**b**')).toContain('<strong>b</strong>')
  })
})
