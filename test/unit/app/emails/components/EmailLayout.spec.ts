import { describe, expect, it } from 'vitest'
import seo from '~~/constants/seo'
import {
  classesWithoutDarkOverride,
  renderEmailSource,
} from '~~/test/unit/utils/email'

function layout(attrs = '') {
  return renderEmailSource(`<template>
  <EmailLayout title="A new adventure awaits" preview="Roll for initiative" ${attrs}>
    <p>Slotted body content</p>
  </EmailLayout>
</template>`)
}

describe('EmailLayout', () => {
  it('Should match snapshot', async () => {
    expect((await layout()).html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', async () => {
    expect(classesWithoutDarkOverride((await layout()).html)).toEqual([])
  })

  it('Should render the title and preview text', async () => {
    const { html } = await layout()

    expect(html).toContain('<title>A new adventure awaits</title>')
    expect(html).toContain('<div style="display:none;">Roll for initiative')
  })

  it('Should render the logo as an image', async () => {
    expect((await layout()).html).toContain(
      `<img src="${seo.url}/logo.png" alt="DnD Tracker" width="250"`,
    )
  })

  it('Should render the slot content', async () => {
    expect((await layout()).html).toContain('<p>Slotted body content</p>')
  })

  it('Should border the card with the border color', async () => {
    const { html } = await layout()

    expect(html).toContain('border: 1px solid #e4e4e7')
    expect(html).toContain('max-width: 700px')
  })

  it('Should inline the light color scheme', async () => {
    const { html } = await layout()

    expect(html).toMatch(
      /<body [^>]*style="[^"]*background-color: #fff;[^"]*color: #09090b;/,
    )
    expect(html).toContain('background-color: #fff')
  })

  it('Should declare and style the dark color scheme', async () => {
    const { html } = await layout()

    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(html).toContain(
      '<meta name="supported-color-schemes" content="light dark">',
    )
    expect(html).toContain('@media (prefers-color-scheme: dark) {')
    expect(html).toMatch(
      /\.bg-background \{\s*background-color: #09090b !important;/,
    )
    expect(html).toContain('class="bg-background text-foreground"')
  })

  it('Should omit the heading by default', async () => {
    expect((await layout()).html).not.toContain('<h1')
  })

  it('Should render the heading when one is given', async () => {
    const { html } = await layout('heading="Campaign invite"')

    expect(html).toMatch(/<h1[^>]*>\s*Campaign invite\s*<\/h1>/)
  })

  it('Should render the footer by default', async () => {
    expect((await layout()).html).toContain('mailto:jeremy@dnd-tracker.com')
  })

  it('Should omit the footer when disabled', async () => {
    const { html } = await layout(':footer="false"')

    expect(html).not.toContain('mailto:jeremy@dnd-tracker.com')
    expect(html).toContain('<p>Slotted body content</p>')
  })

  it('Should render as plain text', async () => {
    const { text } = await layout('heading="Campaign invite"')

    expect(text).toContain('Campaign invite')
    expect(text).toContain('Slotted body content')
  })
})
