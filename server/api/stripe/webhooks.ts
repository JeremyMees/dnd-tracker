import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const raw = (await readRawBody(event)) as string
  const signature = getHeader(event, 'stripe-signature') || ''
  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole<DB>(event)

  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      raw,
      signature,
      config.stripeWebhook,
    )
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return `Unhandled event type: ${stripeEvent.type}`
  }

  const session = stripeEvent.data.object
  const customer = session.customer

  if (typeof customer !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer' })
  }

  if (session.payment_status !== 'paid') {
    return `Ignoring session with payment_status ${session.payment_status}`
  }

  const items = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ['data.price.product'],
  })

  const tier = resolveTier(resolveProduct(items.data[0]?.price?.product).name)

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripeId', customer)
    .maybeSingle()

  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: 'Lookup failed' })
  }

  if (!profile) return 'No profile for this customer'

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ subscriptionType: tier })
    .eq('id', profile.id)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Update failed' })
  }

  return `handled ${stripeEvent.type}`
})
