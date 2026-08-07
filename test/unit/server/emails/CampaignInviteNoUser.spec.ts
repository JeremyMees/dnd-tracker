import { render } from '@vue-email/render'
import { describe, expect, it } from 'vitest'
import CampaignInviteNoUser from '~~/server/emails/CampaignInviteNoUser.vue'
import { colors } from '~~/server/emails/theme'

const props = {
  email: 'adventurer@dnd-tracker.com',
  campaign: 'Curse of Strahd',
  invitedBy: 'The DM',
}

describe('CampaignInviteNoUser email', () => {
  it('Should match snapshot', async () => {
    expect(
      await render(CampaignInviteNoUser, props, { pretty: true }),
    ).toMatchSnapshot()
  })

  it('Should style with inline styles only', async () => {
    const html = await render(CampaignInviteNoUser, props)

    expect(html).not.toContain('class=')
  })

  it('Should point at the register page instead of an invite link', async () => {
    const html = await render(CampaignInviteNoUser, props)

    expect(html).toContain('href="https://dnd-tracker.com/register"')
    expect(html).toContain(`color:${colors.primary}`)
  })

  it('Should render the props into the body', async () => {
    const text = await render(CampaignInviteNoUser, props, { plainText: true })

    expect(text).toContain(props.campaign)
    expect(text).toContain(props.invitedBy)
  })
})
