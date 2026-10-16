import type { serverSupabaseServiceRole } from '#supabase/server'

export async function isProUser(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscriptionType')
    .eq('id', userId)
    .single()

  return isProSubscription(profile?.subscriptionType)
}

export async function campaignOwnerIsPro(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  campaignId: number,
): Promise<boolean> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('createdBy')
    .eq('id', campaignId)
    .single()

  return !!campaign && (await isProUser(supabase, campaign.createdBy))
}
