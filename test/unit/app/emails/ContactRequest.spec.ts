import { beforeAll, describe, expect, it } from 'vitest'
import {
  fillEmail,
  classesWithoutDarkOverride,
  renderEmailTemplate,
  type CompiledEmail,
} from '~~/test/unit/utils/email'
import type { EmailValues } from '~~/server/utils/email'

const values: EmailValues['ContactRequest'] = {
  date: '3-8-2026',
  email: 'adventurer@dnd-tracker.com',
  name: 'Jeremy',
  question: 'How do I add a homebrew monster?',
}

describe('ContactRequest email', () => {
  let compiled: CompiledEmail

  beforeAll(async () => {
    compiled = await renderEmailTemplate('ContactRequest')
  })

  it('Should match snapshot', () => {
    expect(compiled.html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(compiled.html)).toEqual([])
  })

  it('Should render the sender details and question', () => {
    const { html, text } = fillEmail(compiled, values)

    expect(html).toContain(`Contact/question mail from ${values.name}`)
    expect(text).toContain(`DATE: ${values.date},`)
    expect(text).toContain(`EMAIL: ${values.email},`)
    expect(text).toContain(`NAME: ${values.name},`)
    expect(text).toContain(`QUESTION: ${values.question}`)
  })

  it('Should omit the name line and preview name when no name is given', () => {
    const { html, text } = fillEmail(compiled, { ...values, name: undefined })

    expect(html).toContain(
      '<div style="display:none;">Contact/question mail&#8199;',
    )
    expect(html).not.toContain('NAME:')
    expect(text).not.toContain('NAME:')
    expect(text).toContain(`QUESTION: ${values.question}`)
  })

  it('Should escape the question in the html version', () => {
    const { html } = fillEmail(compiled, {
      ...values,
      question: '<script>alert(1)</script>',
    })

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })
})
