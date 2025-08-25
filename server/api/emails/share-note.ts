import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import { sanitizeHTML } from '~/utils/ui-helpers'
import ShareNote from '~~/emails/ShareNote.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    // @ts-expect-error Plunk is not a constructor error
    const plunk = new Plunk.default(plunkApiKey)

    const sanitizedBody = {
      ...body,
      noteContent: sanitizeHTML(body.noteContent),
    }

    const html = await render(
      ShareNote,
      sanitizedBody,
      {
        pretty: true,
      },
    )

    const text = await render(
      ShareNote,
      sanitizedBody,
      {
        plainText: true,
      },
    )

    return await plunk.emails.send({
      from: 'jeremy@dnd-tracker.com',
      to: body.email,
      subject: `New Note Shared from ${body.campaign}!`,
      body: html,
      text,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
