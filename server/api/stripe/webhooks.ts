import { serverSupabaseClient } from '#supabase/server'
import { useServerStripe } from '#stripe/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event)) as string
  const stripe = await useServerStripe(event)
  const client = await serverSupabaseClient<Database>(event)
  const signature = event.headers.get('stripe-signature') || ''
  const config = useRuntimeConfig()

  try {
    const webhookSecret = config.stripeWebhook
    const event = stripe.webhooks.constructEvent(raw, signature, webhookSecret)

    if (event.type !== 'checkout.session.completed') {
      return `Unhandled event type: ${event.type}`
    }

    const subscription = event.data.object

    try {
      if (subscription.customer === null) throw createError('No customer')
      if (typeof subscription.customer !== 'string') throw createError('Invalid customer')

      const { data } = await client
        .from('profiles')
        .select('temp_subscription')
        .eq('stripe_id', subscription.customer)
        .single()

      if (data?.temp_subscription) {
        await client
          .from('profiles')
          .update({ subscription_type: data.temp_subscription })
          .eq('stripe_id', subscription.customer)
      }
    }
    catch (error) {
      return 'Error fetching or updating user'
    }

    return `handled ${event.type}`
  }
  catch (err) {
    return 'Webhook error'
  }
})
