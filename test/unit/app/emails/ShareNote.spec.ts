import { beforeAll, describe, expect, it } from 'vitest'
import {
  fillEmail,
  classesWithoutDarkOverride,
  renderEmailTemplate,
  type CompiledEmail,
} from '~~/test/unit/utils/email'

const values: EmailValues['ShareNote'] = {
  sharedBy: 'The DM',
  campaign: 'Curse of Strahd',
  noteTitle: 'Session 1 recap',
  noteContent: '<p>Beware the <strong>mists</strong></p>',
}

describe('ShareNote email', () => {
  let compiled: CompiledEmail

  beforeAll(async () => {
    compiled = await renderEmailTemplate('ShareNote')
  })

  it('Should match snapshot', () => {
    expect(compiled.html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(compiled.html)).toEqual([])
  })

  it('Should render the campaign into the title', () => {
    const { html } = fillEmail(compiled, values)

    expect(html).toContain(
      `<title>New Note Shared from ${values.campaign}!</title>`,
    )
  })

  it('Should render the note content as html', () => {
    const { html } = fillEmail(compiled, values)

    expect(html).toContain(
      '<div style="padding-top: 26px;"><p>Beware the <strong>mists</strong></p></div>',
    )
  })

  it('Should render the note content as text in the plaintext version', () => {
    const { text } = fillEmail(compiled, values)

    expect(text).toContain('Beware the mists')
    expect(text).not.toContain('<p>')
  })

  it('Should render the values into the body', () => {
    const { text } = fillEmail(compiled, values)

    expect(text).toContain(values.noteTitle)
    expect(text).toContain(values.campaign)
    expect(text).toContain(values.sharedBy)
  })
})
