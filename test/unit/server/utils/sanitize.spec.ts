import { describe, expect, it } from 'vitest'
import { sanitizeServerHTML } from '~~/server/utils/sanitize'

describe('sanitizeServerHTML', () => {
  it('strips disallowed tags entirely, including their content', () => {
    expect(sanitizeServerHTML('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeServerHTML('<style>body{display:none}</style>')).toBe('')
    expect(sanitizeServerHTML('<iframe src="https://evil.com"></iframe>')).toBe(
      '',
    )
    expect(sanitizeServerHTML('<img src="x" alt="Image">')).toBe('')
    expect(sanitizeServerHTML('<svg onload="alert(1)"></svg>')).toBe('')
    expect(sanitizeServerHTML('<video src="v.mp4"></video>')).toBe('')
    expect(sanitizeServerHTML('<audio src="a.mp3"></audio>')).toBe('')
    expect(sanitizeServerHTML('<object data="o.pdf"></object>')).toBe('')
  })

  it('strips a phishing form but keeps surrounding prose', () => {
    const result = sanitizeServerHTML(
      '<p>Hi</p><form action="https://evil.com"><input name="pw"></form>',
    )

    expect(result).toBe('<p>Hi</p>')
  })

  it('strips inline event handlers from otherwise allowed tags', () => {
    const result = sanitizeServerHTML(
      '<a href="https://ok.com" onclick="alert(1)">x</a>',
    )

    expect(result).toBe('<a href="https://ok.com">x</a>')
    expect(result).not.toContain('onclick')
  })

  it('strips dangerous href schemes but keeps the element', () => {
    expect(sanitizeServerHTML('<a href="javascript:alert(1)">c</a>')).toBe(
      '<a>c</a>',
    )
    expect(
      sanitizeServerHTML(
        '<a href="data:text/html,<script>alert(1)</script>">x</a>',
      ),
    ).toBe('<a>x</a>')
  })

  it('does not reassemble a script tag from nested obfuscation', () => {
    const result = sanitizeServerHTML(
      '<p><scr<script>ipt>alert(1)</scr</script>ipt></p>',
    )

    expect(result).not.toContain('<script')
    expect(result).not.toContain('<scr<')
  })

  it('preserves every allowed tag and attribute', () => {
    const dirty = [
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

    const result = sanitizeServerHTML(dirty)

    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<h2>Subtitle</h2>')
    expect(result).toContain('<h3>Subsubtitle</h3>')
    expect(result).toContain('<p>Paragraph</p>')
    expect(result).toContain(
      '<a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">Link</a>',
    )
    expect(result).toContain('<ul><li>Item</li></ul>')
    expect(result).toContain('<ol><li>Item</li></ol>')
    expect(result).toContain('<blockquote>Quote</blockquote>')
    expect(result).toContain('<mark>Highlight</mark>')
    expect(result).toContain('<strong>Bold</strong>')
    expect(result).toContain('<em>Italic</em>')
    expect(result).toContain('<s>Strikethrough</s>')
  })

  it('keeps horizontal rules', () => {
    expect(sanitizeServerHTML('<p>a</p><hr><p>b</p>')).toContain('<hr')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeServerHTML('')).toBe('')
  })
})
