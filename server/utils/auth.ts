import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const claims = await serverSupabaseUser(event)
  const id = claims?.sub

  if (!claims || !id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return { id, email: claims.email, claims }
}

export async function requireCampaignAccess(
  event: H3Event,
  campaignId: number,
  userId: string,
  allowedRoles: UserRole[] = ['Owner', 'Admin', 'Player', 'Viewer'],
): Promise<CampaignAccess> {
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, title, createdBy')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  }

  let role: UserRole | undefined

  if (campaign.createdBy === userId) {
    role = 'Owner'
  } else {
    const { data: member } = await supabase
      .from('team')
      .select('role')
      .match({ campaign: campaignId, user: userId })
      .maybeSingle()

    role = member?.role
  }

  if (!role || !allowedRoles.includes(role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (role !== 'Owner' && !(await isProUser(supabase, campaign.createdBy))) {
    throw createError({ statusCode: 403, statusMessage: 'campaignSuspended' })
  }

  return {
    id: campaign.id,
    title: campaign.title,
    createdBy: campaign.createdBy,
    role,
  }
}

export async function requireEncounterAccess(
  event: H3Event,
  encounterId: number,
  userId: string,
  allowedRoles: UserRole[] = ['Owner', 'Admin', 'Player', 'Viewer'],
): Promise<EncounterAccess> {
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: encounter } = await supabase
    .from('initiative_sheets')
    .select('id, campaign, createdBy')
    .eq('id', encounterId)
    .single()

  if (!encounter) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  if (encounter.createdBy !== userId) {
    if (!encounter.campaign) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await requireCampaignAccess(event, encounter.campaign, userId, allowedRoles)
  } else if (encounter.campaign) {
    await requireCampaignNotSuspended(event, encounter.campaign, userId)
  }

  return encounter
}

async function requireCampaignNotSuspended(
  event: H3Event,
  campaignId: number,
  userId: string,
): Promise<void> {
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('createdBy')
    .eq('id', campaignId)
    .single()

  if (
    campaign &&
    campaign.createdBy !== userId &&
    !(await isProUser(supabase, campaign.createdBy))
  ) {
    throw createError({ statusCode: 403, statusMessage: 'campaignSuspended' })
  }
}
