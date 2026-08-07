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
    .select('id, email, stripeId, subscriptionType')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  const price = await stripe.prices.retrieve(body.lookup, {
    expand: ['product'],
  })

  if (!price.active) {
    throw createError({ statusCode: 400, statusMessage: 'Inactive price' })
  }

  const product = resolveProduct(price.product)

  resolveTier(product.name)

  if (isUpgradeProduct(product.name) && profile.subscriptionType !== 'medior') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Upgrade price not available for this account',
    })
  }

  let customer

  if (!profile.stripeId) {
    customer = await stripe.customers.create({ email: profile.email })
  }

  const lang = localeParam(body.locale)

  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    line_items: [{ price: price.id, quantity: 1 }],
    mode: 'payment',
    success_url: `${config.public.appDomain}${lang}/subscribe-success`,
    cancel_url: `${config.public.appDomain}${lang}/pricing`,
    customer: profile.stripeId || customer?.id,
  })

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(customer && { stripeId: customer.id }),
      stripeSessionId: session.id,
    })
    .eq('id', profile.id)

  if (error) throw createError('Failed to start checkout.')

  return {
    url: session.url,
  }
})
