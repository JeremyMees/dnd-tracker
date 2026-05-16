import { render } from '@vue-email/render'
import CampaignInviteNoUser from '~~/emails/CampaignInviteNoUser.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const html = await render(
      CampaignInviteNoUser,
      body,
      {
        pretty: true,
      },
    )

    const text = await render(
      CampaignInviteNoUser,
      body,
      {
        plainText: true,
      },
    )

    return await $fetch('https://next-api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plunkApiKey}`,
      },
      body: {
        from: 'jeremy@dnd-tracker.com',
        to: body.email,
        subject: 'Added to a campaign on DnD Tracker',
        body: html,
        text,
      },
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
