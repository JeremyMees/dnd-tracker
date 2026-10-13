import * as z from 'zod'
import { ONE_HOUR } from '~~/constants/time'

const bodySchema = z.object({
  name: z.string().min(3).max(30).optional(),
  email: z.email().min(5).max(50),
  question: z.string().min(3).max(1000),
})

export default defineEventHandler(async event => {
  await assertRateLimit(event, {
    key: 'contact-request',
    limit: 5,
    windowMs: ONE_HOUR,
  })

  const body = await readValidatedBody(event, bodySchema.parse)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const { html, text } = await renderEmail('ContactRequest', {
      date: new Date().toLocaleDateString('nl-NL'),
      email: body.email,
      name: body.name,
      question: body.question,
    })

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
  } catch (error) {
    console.error('Error sending contact request email:', error)
    throw createError('Failed to send email.')
  }
})
