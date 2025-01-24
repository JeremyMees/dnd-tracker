import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import ContactRequest from '~/emails/ContactRequest.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    // @ts-expect-error Plunk is not a constructor error
    const plunk = new Plunk.default(plunkApiKey)

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

    await plunk.emails.send({
      from: 'jeremy@dnd-tracker.com',
      to: 'jeremy@dnd-tracker.com',
      subject: 'New contact request/question',
      body: html,
      text,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
