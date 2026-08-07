import { render } from '@vue-email/render'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeatureRequest from '~~/server/emails/FeatureRequest.vue'

const props = {
  email: 'adventurer@dnd-tracker.com',
  name: 'Jeremy',
  title: 'Bulk import monsters',
  text: 'It would be great to import a whole stat block at once.',
}

describe('FeatureRequest email', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-03T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    expect(
      await render(FeatureRequest, props, { pretty: true }),
    ).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    const html = await render(FeatureRequest, props)

    expect(html).not.toContain('class=')
  })

  it('Should render the request details', async () => {
    const text = await render(FeatureRequest, props, { plainText: true })

    expect(text).toContain('3-8-2026')
    expect(text).toContain(props.email)
    expect(text).toContain(props.name)
    expect(text).toContain(props.title)
    expect(text).toContain(props.text)
  })
})
