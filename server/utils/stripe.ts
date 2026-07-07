import { Stripe } from 'stripe'

export const stripe = new Stripe(useRuntimeConfig().stripeSk, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})
