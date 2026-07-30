import { render } from '@vue-email/render'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'
import CampaignInvite from '~~/emails/CampaignInvite.vue'

const bodySchema = z.object({
  campaignId: z.number().int().positive(),
  userId: z.uuid(),
  inviteLink: z.url().max(2048),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const {
    plunkApiKey,
    public: { appDomain },
  } = useRuntimeConfig()

  const campaign = await requireCampaignAccess(
    event,
    body.campaignId,
    caller.id,
    ['Owner', 'Admin'],
  )

  const token = assertInviteLink(body.inviteLink, appDomain)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: invitee } = await supabase
    .from('profiles')
    .select('email, username')
    .eq('id', body.userId)
    .single()

  if (!invitee) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const { data: invite } = await supabase
    .from('join_campaign')
    .select('id')
    .match({ token, campaign: campaign.id, user: body.userId })
    .maybeSingle()

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
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
    inviteLink: body.inviteLink,
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
  } catch (err) {
    throw createError('Failed to send email.')
  }
})

function assertInviteLink(link: string, appDomain: string): string {
  let url: URL
  let expected: URL

  try {
    url = new URL(link)
    expected = new URL(appDomain)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invite link' })
  }

  const token = url.searchParams.get('token')

  if (
    url.origin !== expected.origin ||
    !url.pathname.endsWith('/campaigns/join') ||
    !token
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invite link' })
  }

  return token
}
