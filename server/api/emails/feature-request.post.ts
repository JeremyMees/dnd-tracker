import { render } from '@vue-email/render'
import FeatureRequest from '~~/emails/FeatureRequest.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const html = await render(
      FeatureRequest,
      body,
      {
        pretty: true,
      },
    )

    const text = await render(
      FeatureRequest,
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
        to: 'jeremy@dnd-tracker.com',
        subject: 'New feature request',
        body: html,
        text,
      },
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
