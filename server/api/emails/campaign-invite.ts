import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import CampaignInvite from '~/emails/CampaignInvite.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const plunk = new Plunk.default(plunkApiKey)

    const html = await render(
      CampaignInvite,
      body,
      {
        pretty: true,
      },
    )

    return await plunk.emails.send({
      from: 'jeremy@dnd-tracker.com',
      to: body.email,
      subject: 'New campaign invite',
      body: html,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
