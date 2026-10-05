import { render } from '@vue-email/render'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'
import { ONE_WEEK } from '~~/constants/time'
import CampaignInvite from '~~/server/emails/CampaignInvite.vue'

const bodySchema = z.object({
  campaignId: z.number().int().positive(),
  userId: z.uuid(),
  role: z.enum(['Admin', 'Player', 'Viewer']),
  locale: z.enum(['nl', 'en']),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const {
    plunkApiKey,
    jwtSecret,
    public: { appDomain },
  } = useRuntimeConfig()

  const campaign = await requireCampaignAccess(
    event,
    body.campaignId,
    caller.id,
    ['Owner', 'Admin'],
  )

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: invitee } = await supabase
    .from('profiles')
    .select('email, username')
    .eq('id', body.userId)
    .single()

  if (!invitee) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const { data: membership } = await supabase
    .from('team')
    .select('id')
    .match({ campaign: campaign.id, user: body.userId })
    .maybeSingle()

  if (membership || campaign.createdBy === body.userId) {
    throw createError({ statusCode: 409, statusMessage: 'alreadyAdded' })
  }

  const token = await signJWT(
    jwtSecret,
    {
      user: caller.id,
      data: { campaign: campaign.id, user: body.userId, role: body.role },
    },
    new Date(Date.now() + ONE_WEEK),
  )

  const { data: invite, error: inviteError } = await supabase
    .from('join_campaign')
    .insert({
      campaign: campaign.id,
      user: body.userId,
      role: body.role,
      token,
    })
    .select('id')
    .single()

  if (inviteError?.code === '23505') {
    throw createError({ statusCode: 409, statusMessage: 'alreadyInvited' })
  }

  if (inviteError || !invite) {
    throw createError(
      inviteError
        ? postgresErrorToH3Error(inviteError)
        : { statusCode: 500, statusMessage: 'Failed to create invite' },
    )
  }

  const { data: inviter } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', caller.id)
    .single()

  const props = {
    email: invitee.email,
    username: invitee.username,
    campaign: campaign.title,
    invitedBy: inviter?.username || 'Owner',
    inviteLink: `${appDomain}${localeParam(body.locale)}/campaigns/join?token=${token}`,
  }

  try {
    const html = await render(CampaignInvite, props, { pretty: true })
    const text = await render(CampaignInvite, props, { plainText: true })

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
          to: invitee.email,
          subject: 'New campaign invite',
          body: html,
          text,
        },
      },
    )
  } catch (error) {
    console.error('Error sending campaign invite email:', error)

    await supabase.from('join_campaign').delete().eq('id', invite.id)

    throw createError('Failed to send email.')
  }
})
