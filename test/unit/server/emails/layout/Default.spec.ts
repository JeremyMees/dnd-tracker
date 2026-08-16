import { render } from '@vue-email/render'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import DefaultEmail from '~~/server/emails/Layout/Default.vue'
import { colors } from '~~/server/emails/theme'

const props = {
  email: 'adventurer@dnd-tracker.com',
  title: 'A new adventure awaits',
  preview: 'Roll for initiative',
}

function host(overrides: Record<string, unknown> = {}) {
  return defineComponent(
    () => () =>
      h(
        DefaultEmail,
        { ...props, ...overrides },
        {
          default: () => h('p', 'Slotted body content'),
        },
      ),
  )
}

describe('Default email layout', () => {
  it('Should match snapshot', async () => {
    expect(await render(host(), undefined, { pretty: true })).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    expect(await render(host())).not.toContain('class=')
  })

  it('Should render the title and preview text', async () => {
    const html = await render(host())

    expect(html).toContain(`<title>`)
    expect(html).toContain(props.title)
    expect(html).toContain(props.preview)
  })

  it('Should render the slot content', async () => {
    expect(await render(host())).toContain('<p>Slotted body content</p>')
  })

  it('Should border the container with the secondary color', async () => {
    const html = await render(host())

    expect(html).toContain(`border:4px solid ${colors.secondary}`)
    expect(html).toContain('max-width:700px')
  })

  it('Should omit the heading by default', async () => {
    expect(await render(host())).not.toContain('<h1')
  })

  it('Should render the heading when one is given', async () => {
    const html = await render(host({ heading: 'Campaign invite' }))

    expect(html).toContain('<h1')
    expect(html).toContain('Campaign invite')
  })

  it('Should render the footer by default', async () => {
    expect(await render(host())).toContain('mailto:jeremy@dnd-tracker.com')
  })

  it('Should omit the footer when disabled', async () => {
    const html = await render(host({ footer: false }))

    expect(html).not.toContain('mailto:jeremy@dnd-tracker.com')
    expect(html).toContain('<p>Slotted body content</p>')
  })

  it('Should render as plain text', async () => {
    const text = await render(host({ heading: 'Campaign invite' }), undefined, {
      plainText: true,
    })

    expect(text.toLowerCase()).toContain('campaign invite')
    expect(text).toContain('Slotted body content')
  })
})
