import { useServerStripe } from '#stripe/server'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = await useServerStripe(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const price = await stripe.prices.retrieve(body.lookup)

  let customer
  let update = {}

  if (!body.customer) {
    customer = await stripe.customers.create({ email: body.user.email })

    update = { stripe_id: customer.id }
  }

  const lang = body.locale === 'nl' ? '' : `/${body.locale}`

  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    line_items: [{ price: price.id, quantity: 1 }],
    mode: 'payment',
    success_url: `${config.public.appDomain}${lang}/subscribe-success`,
    cancel_url: `${config.public.appDomain}${lang}/pricing`,
    customer: body.customer || customer?.id,
  })

  await client.from('profiles')
    .update({
      ...update,
      stripe_session_id: session.id,
      temp_subscription: body.type === 'upgrade to pro' ? 'pro' : body.type,
    } as never)
    .eq('id', body.user.id)

  return {
    url: session.url,
  }
})
