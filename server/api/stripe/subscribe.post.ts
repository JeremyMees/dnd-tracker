import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  lookup: z.string().min(1).max(255),
  locale: z.enum(['nl', 'en']),
})

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, stripeId, stripeSubscriptionId, billingInterval')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  if (profile.billingInterval === 'lifetime') {
    throw createError({ statusCode: 403, statusMessage: 'Already lifetime' })
  }

  const price = await stripe.prices.retrieve(body.lookup, {
    expand: ['product'],
  })

  if (!price.active) {
    throw createError({ statusCode: 400, statusMessage: 'Inactive price' })
  }

  resolveTier(resolveProduct(price.product))

  const interval = resolveInterval(price)

  if (interval === 'month' && profile.stripeSubscriptionId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Use the billing portal',
    })
  }

  let customerId = profile.stripeId

  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile.email })

    const { error } = await supabase
      .from('profiles')
      .update({ stripeId: customer.id })
      .eq('id', profile.id)

    if (error) throw createError('Failed to start checkout.')

    customerId = customer.id
  }

  const lang = localeParam(body.locale)

  const session = await stripe.checkout.sessions.create({
    integration_identifier: CHECKOUT_INTEGRATION_ID,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    line_items: [{ price: price.id, quantity: 1 }],
    mode: interval === 'month' ? 'subscription' : 'payment',
    success_url: `${config.public.appDomain}${lang}/subscribe-success`,
    cancel_url: `${config.public.appDomain}${lang}/pricing`,
    customer: customerId,
  })

  const { error } = await supabase
    .from('profiles')
    .update({ stripeSessionId: session.id })
    .eq('id', profile.id)

  if (error) throw createError('Failed to start checkout.')

  return {
    url: session.url,
  }
})
