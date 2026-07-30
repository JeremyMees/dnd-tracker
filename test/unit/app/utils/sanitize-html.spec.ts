// @vitest-environment jsdom
// NOTE: This file uses the jsdom environment instead of the default nuxt/happy-dom
// one. DOMPurify produces incorrect output under happy-dom (it leaves some
// disallowed tags/siblings in place) — see happy-dom#1810 and DOMPurify#876.
// jsdom is spec-compliant and matches real browser behavior.
import { describe, expect, it } from 'vitest'
import { sanitizeHTML } from '~/utils/ui-helpers'

describe('sanitizeHTML', () => {
  it('should sanitize HTML by removing disallowed tags', () => {
    const dirtyHtml = `
      <script>alert("xss")</script>
      <img src="https://example.com/image.jpg" alt="Image">
      <iframe src="https://example.com/iframe"></iframe>
      <video src="https://example.com/video.mp4"></video>
      <audio src="https://example.com/audio.mp3"></audio>
      <object data="https://example.com/object.pdf"></object>
    `
    const result = sanitizeHTML(dirtyHtml)

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('<img>')
    expect(result).not.toContain('<iframe>')
    expect(result).not.toContain('<video>')
    expect(result).not.toContain('<audio>')
    expect(result).not.toContain('<object>')
  })

  it('Should allow all allowed tags and attributes', () => {
    const dirtyHtml = `
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <h3>Subsubtitle</h3>
      <p>Paragraph</p>
      <a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">Link</a>
      <ul><li>Item 1</li></ul>
      <ol><li>Item 1</li></ol>
      <blockquote>Quote</blockquote>
      <mark>Highlight</mark>
      <strong>Bold</strong>
      <em>Italic</em>
      <s>Strikethrough</s>
    `
    const result = sanitizeHTML(dirtyHtml)

    expect(result).toContain('<h1>')
    expect(result).toContain('<h2>')
    expect(result).toContain('<h3>')
    expect(result).toContain('<p>')
    expect(result).toContain(
      '<a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">',
    )
    expect(result).toContain('<ul>')
    expect(result).toContain('<ol>')
    expect(result).toContain('<li>')
    expect(result).toContain('<blockquote>')
    expect(result).toContain('<mark>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('<s>')
  })

  it('should replace <hr /> with <hr>', () => {
    const html = '<p>Text</p><hr /><p>More text</p>'
    const result = sanitizeHTML(html)

    expect(result).toContain('<hr>')
    expect(result).not.toContain('<hr />')
  })
})
