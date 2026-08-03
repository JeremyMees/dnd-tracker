import { render } from '@vue-email/render'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContactRequest from '~~/server/emails/ContactRequest.vue'

const props = {
  email: 'adventurer@dnd-tracker.com',
  question: 'How do I add a homebrew monster?',
  name: 'Jeremy',
}

describe('ContactRequest email', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-03T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    expect(
      await render(ContactRequest, props, { pretty: true }),
    ).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    const html = await render(ContactRequest, props)

    expect(html).not.toContain('class=')
  })

  it('Should render the sender details and question', async () => {
    const text = await render(ContactRequest, props, { plainText: true })

    expect(text).toContain('3-8-2026')
    expect(text).toContain(props.email)
    expect(text).toContain(props.name)
    expect(text).toContain(props.question)
  })

  it('Should omit the name line when no name is given', async () => {
    const text = await render(
      ContactRequest,
      { email: props.email, question: props.question },
      { plainText: true },
    )

    expect(text).not.toContain('NAME:')
    expect(text).toContain(props.question)
  })
})
