import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import CampaignInviteNoUser from '~/emails/CampaignInviteNoUser.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const plunk = new Plunk.default(plunkApiKey)

    const html = await render(
      CampaignInviteNoUser,
      body,
      {
        pretty: true,
      },
    )

    return await plunk.emails.send({
      from: 'jeremy@dnd-tracker.com',
      to: body.email,
      subject: 'Added to a campaign on DnD Tracker',
      body: html,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
