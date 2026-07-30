import { render } from '@vue-email/render'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'
import CampaignInviteNoUser from '~~/emails/CampaignInviteNoUser.vue'

const bodySchema = z.object({
  campaignId: z.number().int().positive(),
  email: z.email().max(254),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const { plunkApiKey } = useRuntimeConfig()

  const campaign = await requireCampaignAccess(
    event,
    body.campaignId,
    caller.id,
    ['Owner', 'Admin'],
  )

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: inviter } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', caller.id)
    .single()

  const props = {
    email: body.email,
    campaign: campaign.title,
    invitedBy: inviter?.username || 'Owner',
  }

  try {
    const html = await render(CampaignInviteNoUser, props, { pretty: true })
    const text = await render(CampaignInviteNoUser, props, { plainText: true })

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
          to: body.email,
          subject: 'Added to a campaign on DnD Tracker',
          body: html,
          text,
        },
      },
    )
  } catch (err) {
    throw createError('Failed to send email.')
  }
})
