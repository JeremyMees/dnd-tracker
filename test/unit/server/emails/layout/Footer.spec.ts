import { render } from '@vue-email/render'
import { describe, expect, it } from 'vitest'
import Footer from '~~/server/emails/Layout/Footer.vue'
import { colors } from '~~/server/emails/theme'

const socials = [
  'https://www.instagram.com/dnd.tracker/',
  'https://bsky.app/profile/lilmees.bsky.social',
  'https://ko-fi.com/jeremymees',
]

describe('Footer email layout', () => {
  it('Should match snapshot', async () => {
    expect(await render(Footer, undefined, { pretty: true })).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    expect(await render(Footer)).not.toContain('class=')
  })

  it('Should link to the site and the contact address', async () => {
    const html = await render(Footer)

    expect(html).toContain('href="https://dnd-tracker.com"')
    expect(html).toContain('href="mailto:jeremy@dnd-tracker.com"')
  })

  it('Should link to every social profile', async () => {
    const html = await render(Footer)

    socials.forEach(href => expect(html).toContain(`href="${href}"`))
  })

  it('Should color every link with the primary color', async () => {
    const html = await render(Footer)
    const links = html.match(/<a [^>]*>/g) ?? []

    expect(links).toHaveLength(5)
    links.forEach(link => expect(link).toContain(`color:${colors.primary};`))
  })

  it('Should separate itself with a secondary colored rule', async () => {
    expect(await render(Footer)).toContain(
      `border-top:1px solid ${colors.secondary}`,
    )
  })

  it('Should render as plain text', async () => {
    const text = await render(Footer, undefined, { plainText: true })

    expect(text).toContain('DnD Tracker')
    expect(text).toContain('Keep adventuring')
    expect(text).toContain('jeremy@dnd-tracker.com')
  })
})
