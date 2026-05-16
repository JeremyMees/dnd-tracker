import { render } from '@vue-email/render'
import CampaignInvite from '~~/emails/CampaignInvite.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const html = await render(
      CampaignInvite,
      body,
      {
        pretty: true,
      },
    )

    const text = await render(
      CampaignInvite,
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
        subject: 'New campaign invite',
        body: html,
        text,
      },
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
