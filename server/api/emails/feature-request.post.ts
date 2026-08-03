import { render } from '@vue-email/render'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'
import FeatureRequest from '~~/server/emails/FeatureRequest.vue'

const bodySchema = z.object({
  title: z.string().min(3).max(50),
  text: z.string().min(10).max(500),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const { plunkApiKey } = useRuntimeConfig()

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', caller.id)
    .single()

  const props = {
    email: profile?.email ?? caller.email ?? '',
    name: profile?.username ?? 'Unknown',
    title: body.title,
    text: body.text,
  }

  try {
    const html = await render(FeatureRequest, props, { pretty: true })
    const text = await render(FeatureRequest, props, { plainText: true })

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
          subject: 'New feature request',
          body: html,
          text,
        },
      },
    )
  } catch (error) {
    console.error('Error sending feature request email:', error)
    throw createError('Failed to send email.')
  }
})
