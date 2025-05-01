import Plunk from '@plunk/node'
import { render } from '@vue-email/render'
import FeatureRequest from '~~/emails/FeatureRequest.vue'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plunkApiKey } = useRuntimeConfig()

  try {
    // @ts-expect-error Plunk is not a constructor error
    const plunk = new Plunk.default(plunkApiKey)

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

    return await plunk.emails.send({
      from: 'jeremy@dnd-tracker.com',
      to: 'jeremy@dnd-tracker.com',
      subject: 'New feature request',
      body: html,
      text,
    })
  }
  catch (err) {
    throw createError('Failed to send email.')
  }
})
