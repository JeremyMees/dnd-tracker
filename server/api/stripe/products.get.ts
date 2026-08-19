export default defineCachedEventHandler(
  async (): Promise<StripePrice[]> => {
    const { data: prices } = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    })

    return prices
      .filter(price => price.lookup_key)
      .map(price => ({
        id: price.id,
        lookupKey: price.lookup_key!,
        price: (price.unit_amount ?? 0) / 100,
        interval: resolveInterval(price),
      }))
  },
  { maxAge: 3600 },
)
