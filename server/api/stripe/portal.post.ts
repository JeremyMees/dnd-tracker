import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripeId')
    .eq('id', user.id)
    .single()

  if (!profile?.stripeId) {
    throw createError({ statusCode: 400, statusMessage: 'No billing account' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeId,
    return_url: `${config.public.appDomain}/profile`,
  })

  return { url: session.url }
})
