// @vitest-environment jsdom
// NOTE: This file uses the jsdom environment instead of the default nuxt/happy-dom
// one. DOMPurify produces incorrect output under happy-dom (it leaves some
// disallowed tags/siblings in place) — see happy-dom#1810 and DOMPurify#876.
// jsdom is spec-compliant and matches real browser behavior.
import { describe, expect, it } from 'vitest'
import {
  loadMarkdownSanitizer,
  sanitizeClientHTML,
} from '~/utils/sanitize-html'

const allowedMarkup = [
  '<h1>Title</h1>',
  '<h2>Subtitle</h2>',
  '<h3>Subsubtitle</h3>',
  '<p>Paragraph</p>',
  '<a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">Link</a>',
  '<ul><li>Item</li></ul>',
  '<ol><li>Item</li></ol>',
  '<blockquote>Quote</blockquote>',
  '<mark>Highlight</mark>',
  '<strong>Bold</strong>',
  '<em>Italic</em>',
  '<s>Strikethrough</s>',
].join('')

describe('sanitizeClientHTML', () => {
  it('strips disallowed tags entirely, including their content', async () => {
    expect(await sanitizeClientHTML('<script>alert("xss")</script>')).toBe('')
    expect(await sanitizeClientHTML('<script src="evil.js"></script>')).toBe('')
    expect(await sanitizeClientHTML('<style>body{display:none}</style>')).toBe(
      '',
    )
    expect(
      await sanitizeClientHTML('<iframe src="https://evil.com"></iframe>'),
    ).toBe('')
    expect(
      await sanitizeClientHTML(
        '<img src="https://example.com/i.jpg" alt="Image">',
      ),
    ).toBe('')
    expect(await sanitizeClientHTML('<img src=x onerror="alert(1)">')).toBe('')
    expect(await sanitizeClientHTML('<svg onload="alert(1)"></svg>')).toBe('')
    expect(await sanitizeClientHTML('<video src="v.mp4"></video>')).toBe('')
    expect(await sanitizeClientHTML('<audio src="a.mp3"></audio>')).toBe('')
    expect(await sanitizeClientHTML('<object data="o.pdf"></object>')).toBe('')
  })

  it('strips a phishing form but keeps surrounding prose', async () => {
    const result = await sanitizeClientHTML(
      '<p>Hi</p><form action="https://evil.com"><input name="pw"></form>',
    )

    expect(result).toBe('<p>Hi</p>')
  })

  it('strips inline event handlers from otherwise allowed tags', async () => {
    const result = await sanitizeClientHTML(
      '<a href="https://ok.com" onclick="alert(1)">x</a>',
    )

    expect(result).toBe('<a href="https://ok.com">x</a>')
    expect(result).not.toContain('onclick')
  })

  it('strips dangerous href schemes but keeps the element', async () => {
    expect(
      await sanitizeClientHTML('<a href="javascript:alert(1)">c</a>'),
    ).toBe('<a>c</a>')
    expect(
      await sanitizeClientHTML(
        '<a href="data:text/html,<script>alert(1)</script>">x</a>',
      ),
    ).toBe('<a>x</a>')
  })

  it('does not reassemble a script tag from nested obfuscation', async () => {
    const result = await sanitizeClientHTML(
      '<p><scr<script>ipt>alert(1)</scr</script>ipt></p>',
    )

    expect(result).not.toContain('<script')
    expect(result).not.toContain('<scr<')
  })

  it('leaves markup built only from allowed tags and attributes untouched', async () => {
    expect(await sanitizeClientHTML(allowedMarkup)).toBe(allowedMarkup)
  })

  it('should replace <hr /> with <hr>', async () => {
    const html = '<p>Text</p><hr /><p>More text</p>'
    const result = await sanitizeClientHTML(html)

    expect(result).toContain('<hr>')
    expect(result).not.toContain('<hr />')
  })

  it('returns an empty string for empty input', async () => {
    expect(await sanitizeClientHTML('')).toBe('')
  })
})

describe('loadMarkdownSanitizer', () => {
  it('keeps the table markup that SRD descriptions rely on', async () => {
    const sanitize = await loadMarkdownSanitizer()
    const result = sanitize(
      '<table><thead><tr><th>Die</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>',
    )

    expect(result).toContain('<table>')
    expect(result).toContain('<th>Die</th>')
    expect(result).toContain('<td>1</td>')
  })

  it('keeps prose wrapped in a paragraph next to a list', async () => {
    const sanitize = await loadMarkdownSanitizer()

    expect(sanitize('<p>Effects.</p>\n<ul>\n<li>One</li>\n</ul>')).toBe(
      '<p>Effects.</p>\n<ul>\n<li>One</li>\n</ul>',
    )
  })

  it('strips scripts and inline event handlers', async () => {
    const sanitize = await loadMarkdownSanitizer()

    expect(sanitize('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>')
    expect(sanitize('<img src=x onerror="alert(1)">')).not.toContain('onerror')
    expect(sanitize('<a href="javascript:alert(1)">c</a>')).toBe('<a>c</a>')
  })
})
