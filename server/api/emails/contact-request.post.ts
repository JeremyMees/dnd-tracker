import { render } from '@vue-email/render'
import * as z from 'zod'
import ContactRequest from '~~/emails/ContactRequest.vue'

const bodySchema = z.object({
  name: z.string().min(3).max(30).optional(),
  email: z.email().min(5).max(50),
  question: z.string().min(3).max(1000),
})

export default defineEventHandler(async event => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const html = await render(ContactRequest, body, { pretty: true })
    const text = await render(ContactRequest, body, { plainText: true })

    return await $fetch<PlunkSendResponse, string>(
      'https://next-api.useplunk.com/v1/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plunkApiKey}`,
        },
        body: {
          from: 'jeremy@dnd-tracker.com',
          to: 'jeremy@dnd-tracker.com',
          subject: 'New contact request/question',
          body: html,
          text,
        },
      },
    )
  } catch (err) {
    throw createError('Failed to send email.')
  }
})
