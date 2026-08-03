// @vitest-environment jsdom
// NOTE: This file uses the jsdom environment instead of the default nuxt/happy-dom
// one. DOMPurify produces incorrect output under happy-dom (it leaves some
// disallowed tags/siblings in place) — see happy-dom#1810 and DOMPurify#876.
// jsdom is spec-compliant and matches real browser behavior.
import { describe, expect, it } from 'vitest'
import { sanitizeClientHTML } from '~/utils/ui-helpers'

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
  it('strips disallowed tags entirely, including their content', () => {
    expect(sanitizeClientHTML('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeClientHTML('<script src="evil.js"></script>')).toBe('')
    expect(sanitizeClientHTML('<style>body{display:none}</style>')).toBe('')
    expect(sanitizeClientHTML('<iframe src="https://evil.com"></iframe>')).toBe(
      '',
    )
    expect(
      sanitizeClientHTML('<img src="https://example.com/i.jpg" alt="Image">'),
    ).toBe('')
    expect(sanitizeClientHTML('<img src=x onerror="alert(1)">')).toBe('')
    expect(sanitizeClientHTML('<svg onload="alert(1)"></svg>')).toBe('')
    expect(sanitizeClientHTML('<video src="v.mp4"></video>')).toBe('')
    expect(sanitizeClientHTML('<audio src="a.mp3"></audio>')).toBe('')
    expect(sanitizeClientHTML('<object data="o.pdf"></object>')).toBe('')
  })

  it('strips a phishing form but keeps surrounding prose', () => {
    const result = sanitizeClientHTML(
      '<p>Hi</p><form action="https://evil.com"><input name="pw"></form>',
    )

    expect(result).toBe('<p>Hi</p>')
  })

  it('strips inline event handlers from otherwise allowed tags', () => {
    const result = sanitizeClientHTML(
      '<a href="https://ok.com" onclick="alert(1)">x</a>',
    )

    expect(result).toBe('<a href="https://ok.com">x</a>')
    expect(result).not.toContain('onclick')
  })

  it('strips dangerous href schemes but keeps the element', () => {
    expect(sanitizeClientHTML('<a href="javascript:alert(1)">c</a>')).toBe(
      '<a>c</a>',
    )
    expect(
      sanitizeClientHTML(
        '<a href="data:text/html,<script>alert(1)</script>">x</a>',
      ),
    ).toBe('<a>x</a>')
  })

  it('does not reassemble a script tag from nested obfuscation', () => {
    const result = sanitizeClientHTML(
      '<p><scr<script>ipt>alert(1)</scr</script>ipt></p>',
    )

    expect(result).not.toContain('<script')
    expect(result).not.toContain('<scr<')
  })

  it('leaves markup built only from allowed tags and attributes untouched', () => {
    expect(sanitizeClientHTML(allowedMarkup)).toBe(allowedMarkup)
  })

  it('should replace <hr /> with <hr>', () => {
    const html = '<p>Text</p><hr /><p>More text</p>'
    const result = sanitizeClientHTML(html)

    expect(result).toContain('<hr>')
    expect(result).not.toContain('<hr />')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeClientHTML('')).toBe('')
  })
})
