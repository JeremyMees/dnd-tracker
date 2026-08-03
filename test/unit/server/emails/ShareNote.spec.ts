import { render } from '@vue-email/render'
import { describe, expect, it } from 'vitest'
import ShareNote from '~~/server/emails/ShareNote.vue'

const props = {
  email: 'adventurer@dnd-tracker.com',
  noteContent: '<p>Beware the mists</p>',
  noteTitle: 'Session 1 recap',
  campaign: 'Curse of Strahd',
  sharedBy: 'The DM',
}

describe('ShareNote email', () => {
  it('Should match snapshot', async () => {
    expect(await render(ShareNote, props, { pretty: true })).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    const html = await render(ShareNote, props)

    expect(html).not.toContain('class=')
  })

  it('Should render the note content as html', async () => {
    const html = await render(ShareNote, props)

    expect(html).toContain('<p>Beware the mists</p>')
  })

  it('Should render the props into the body', async () => {
    const text = await render(ShareNote, props, { plainText: true })

    expect(text).toContain(props.noteTitle)
    expect(text).toContain(props.campaign)
    expect(text).toContain(props.sharedBy)
  })
})
