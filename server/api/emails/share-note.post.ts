import { render } from '@vue-email/render'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'
import ShareNote from '~~/emails/ShareNote.vue'

const bodySchema = z.object({
  noteId: z.number().int().positive(),
  email: z.email().max(254),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const { plunkApiKey } = useRuntimeConfig()

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: note } = await supabase
    .from('notes')
    .select('id, title, text, campaign')
    .eq('id', body.noteId)
    .single()

  if (!note) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  const campaign = await requireCampaignAccess(event, note.campaign, caller.id)

  const { data: sender } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', caller.id)
    .single()

  const props = {
    email: body.email,
    noteContent: note.text ?? '',
    noteTitle: note.title,
    campaign: campaign.title,
    sharedBy: sender?.username || 'A campaign member',
  }

  try {
    const html = await render(ShareNote, props, { pretty: true })
    const text = await render(ShareNote, props, { plainText: true })

    return await $fetch('https://next-api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plunkApiKey}`,
      },
      body: {
        from: 'jeremy@dnd-tracker.com',
        to: body.email,
        subject: `New Note Shared from ${campaign.title}!`,
        body: html,
        text,
      },
    })
  } catch (err) {
    throw createError('Failed to send email.')
  }
})
