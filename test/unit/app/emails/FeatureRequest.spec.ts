import { beforeAll, describe, expect, it } from 'vitest'
import {
  fillEmail,
  classesWithoutDarkOverride,
  renderEmailTemplate,
  type CompiledEmail,
} from '~~/test/unit/utils/email'
import type { EmailValues } from '~~/server/utils/email'

const values: EmailValues['FeatureRequest'] = {
  date: '3-8-2026',
  email: 'adventurer@dnd-tracker.com',
  name: 'Jeremy',
  title: 'Bulk import monsters',
  text: 'It would be great to import a whole stat block at once.',
}

describe('FeatureRequest email', () => {
  let compiled: CompiledEmail

  beforeAll(async () => {
    compiled = await renderEmailTemplate('FeatureRequest')
  })

  it('Should match snapshot', () => {
    expect(compiled.html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(compiled.html)).toEqual([])
  })

  it('Should render the request details', () => {
    const { html, text } = fillEmail(compiled, values)

    expect(html).toContain(`feature request from ${values.name}`)
    expect(text).toContain(`DATE: ${values.date},`)
    expect(text).toContain(`EMAIL: ${values.email},`)
    expect(text).toContain(`NAME: ${values.name},`)
    expect(text).toContain(`TITLE: ${values.title}`)
    expect(text).toContain(`TEXT: ${values.text}`)
  })
})
