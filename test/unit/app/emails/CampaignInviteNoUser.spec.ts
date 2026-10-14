import { beforeAll, describe, expect, it } from 'vitest'
import {
  fillEmail,
  classesWithoutDarkOverride,
  renderEmailTemplate,
  type CompiledEmail,
} from '~~/test/unit/utils/email'

const values: EmailValues['CampaignInviteNoUser'] = {
  campaign: 'Curse of Strahd',
  invitedBy: 'The DM',
}

describe('CampaignInviteNoUser email', () => {
  let compiled: CompiledEmail

  beforeAll(async () => {
    compiled = await renderEmailTemplate('CampaignInviteNoUser')
  })

  it('Should match snapshot', () => {
    expect(compiled.html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(compiled.html)).toEqual([])
  })

  it('Should point at the register page with the primary color', () => {
    expect(compiled.html).toMatch(
      /<a href="https:\/\/www\.dnd-tracker\.com\/register"[^>]*style="color: #7231e3; text-decoration: underline;"/,
    )
  })

  it('Should render the values into the preview and body', () => {
    const { html, text } = fillEmail(compiled, values)

    expect(html).toContain(`Join ${values.campaign} on DnD Tracker`)
    expect(text).toContain(values.campaign)
    expect(text).toContain(values.invitedBy)
  })
})
