import { beforeAll, describe, expect, it } from 'vitest'
import {
  fillEmail,
  classesWithoutDarkOverride,
  renderEmailTemplate,
  type CompiledEmail,
} from '~~/test/unit/utils/email'

const values: EmailValues['CampaignInvite'] = {
  username: 'Jeremy',
  campaign: 'Curse of Strahd',
  invitedBy: 'The DM',
  inviteLink: 'https://www.dnd-tracker.com/invite/abc123',
}

describe('CampaignInvite email', () => {
  let compiled: CompiledEmail

  beforeAll(async () => {
    compiled = await renderEmailTemplate('CampaignInvite')
  })

  it('Should match snapshot', () => {
    expect(compiled.html).toMatchSnapshot()
  })

  it('Should inline every style except the dark mode overrides', () => {
    expect(classesWithoutDarkOverride(compiled.html)).toEqual([])
  })

  it('Should link to the invite with the primary color', () => {
    const { html } = fillEmail(compiled, values)

    expect(html).toMatch(
      new RegExp(
        `<a href="${values.inviteLink}"[^>]*style="color: #7231e3; text-decoration: underline;"`,
      ),
    )
  })

  it('Should render the values into the preview and body', () => {
    const { html, text } = fillEmail(compiled, values)

    expect(html).toContain(`Join ${values.campaign} on DnD Tracker`)
    expect(text).toContain(`Hi ${values.username},`)
    expect(text).toContain(values.campaign)
    expect(text).toContain(values.invitedBy)
    expect(text).toContain(values.inviteLink)
  })
})
