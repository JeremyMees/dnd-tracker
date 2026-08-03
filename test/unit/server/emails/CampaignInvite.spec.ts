import { render } from '@vue-email/render'
import { describe, expect, it } from 'vitest'
import CampaignInvite from '~~/server/emails/CampaignInvite.vue'
import { colors } from '~~/server/emails/theme'

const props = {
  email: 'adventurer@dnd-tracker.com',
  username: 'Jeremy',
  campaign: 'Curse of Strahd',
  invitedBy: 'The DM',
  inviteLink: 'https://dnd-tracker.com/invite/abc123',
}

describe('CampaignInvite email', () => {
  it('Should match snapshot', async () => {
    expect(
      await render(CampaignInvite, props, { pretty: true }),
    ).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    const html = await render(CampaignInvite, props)

    expect(html).not.toContain('class=')
  })

  it('Should link to the invite with the primary color', async () => {
    const html = await render(CampaignInvite, props)

    expect(html).toContain(`href="${props.inviteLink}"`)
    expect(html).toContain(`color:${colors.primary}`)
  })

  it('Should render the props into the body', async () => {
    const text = await render(CampaignInvite, props, { plainText: true })

    expect(text).toContain(props.username)
    expect(text).toContain(props.campaign)
    expect(text).toContain(props.invitedBy)
  })
})
