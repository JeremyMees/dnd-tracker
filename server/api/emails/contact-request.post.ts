import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import ContactRequest from '~/emails/ContactRequest.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    const plunk = new Plunk.default(plunkApiKey)

    const html = await render(
      ContactRequest,
      body,
      {
        pretty: true,
      },
    )

    return await plunk.emails.send({
      from: body.email,
      to: 'jeremy@dnd-tracker.com',
      subject: 'New contact request/question',
      body: html,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
