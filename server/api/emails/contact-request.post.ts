import { render } from '@vue-email/render'
import ContactRequest from '~~/emails/ContactRequest.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const html = await render(
      ContactRequest,
      body,
      {
        pretty: true,
      },
    )

    const text = await render(
      ContactRequest,
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
        subject: 'New contact request/question',
        body: html,
        text,
      },
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
