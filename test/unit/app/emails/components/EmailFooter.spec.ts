import { beforeAll, describe, expect, it } from 'vitest'
import seo from '~~/constants/seo'
import {
  classesWithoutDarkOverride,
  renderEmailSource,
  type CompiledEmail,
} from '~~/test/unit/utils/email'

const socials = [
  'https://www.instagram.com/dnd.tracker/',
  'https://bsky.app/profile/lilmees.bsky.social',
  'https://ko-fi.com/jeremymees',
]

describe('EmailFooter', () => {
  let footer: CompiledEmail

  beforeAll(async () => {
    footer = await renderEmailSource(`<template>
  <EmailLayout title="Footer" preview="Footer" />
</template>`)
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(footer.html)).toEqual([])
  })

  it('Should link to the site and the contact address', () => {
    expect(footer.html).toContain('href="https://www.dnd-tracker.com"')
    expect(footer.html).toContain('href="mailto:jeremy@dnd-tracker.com"')
  })

  it('Should link to every social profile', () => {
    socials.forEach(href => expect(footer.html).toContain(`href="${href}"`))
  })

  it('Should color the text links with the primary color', () => {
    for (const href of [
      'https://www.dnd-tracker.com',
      'mailto:jeremy@dnd-tracker.com',
    ]) {
      expect(footer.html).toMatch(
        new RegExp(`<a href="${href}"[^>]*style="[^"]*color: #7231e3`),
      )
    }
  })

  it('Should render the dragon and social icons as absolute png images', () => {
    for (const icon of ['dragon', 'instagram', 'bluesky', 'coffee']) {
      expect(footer.html).toContain(`<img src="${seo.url}/${icon}.png"`)
    }
    expect(footer.html).not.toContain('<svg')
  })

  it('Should separate itself with a secondary colored rule', () => {
    expect(footer.html).toMatch(
      /<div role="separator"[^>]*style="[^"]*background-color: #e4e4e7/,
    )
  })

  it('Should render as plain text', () => {
    expect(footer.text).toContain('DnD Tracker')
    expect(footer.text).toContain('Keep adventuring')
    expect(footer.text).toContain('jeremy@dnd-tracker.com')
  })
})
