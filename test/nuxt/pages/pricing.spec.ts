import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Pricing from '~/pages/pricing.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { navigateTo, useFetch, useSeo } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  useFetch: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/queries/pricing', () => ({
  usePricingListing: () => ({ data: products, isPending }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useFetch', () => useFetch)
mockNuxtImport('useAuthentication', () => () => ({ user }))

const user = ref<AuthUser | null>(null)
const products = ref<ProductPricing[] | undefined>()
const isPending = ref(false)

const starter: ProductPricing = {
  key: 'free',
  tier: 'free',
  interval: null,
  title: 'Starter',
  description: 'pages.pricing.starter',
  price: 0,
  items: [
    { label: 'pages.pricing.update', icon: 'check' },
    { number: 10, label: 'general.encounter', icon: 'check' },
    { label: 'pages.pricing.live', icon: 'x' },
  ],
}

const proMonthly: ProductPricing = {
  key: 'pro_monthly',
  tier: 'pro',
  interval: 'month',
  title: 'Pro',
  description: 'pages.pricing.pro',
  price: 5,
  id: 'pro-monthly-lookup',
  items: [{ number: 250, label: 'general.encounter', icon: 'check' }],
}

const proLifetime: ProductPricing = {
  key: 'pro_lifetime',
  tier: 'pro',
  interval: 'lifetime',
  title: 'Pro',
  description: 'pages.pricing.pro',
  price: 50,
  id: 'pro-lifetime-lookup',
  items: [{ number: 250, label: 'general.encounter', icon: 'check' }],
}

const stubs = {
  Motion: { template: '<div><slot /></div>' },
  NuxtLayout: nuxtLayoutStub,
}

async function mountPage() {
  const component = await mountSuspended(Pricing, { global: { stubs } })

  await flushPromises()

  return {
    component,
    get titles() {
      return component
        .findAll('[test-id="product-title"]')
        .map(title => title.text())
    },
    card(index: number) {
      const cards = component.findAll('[test-id="product"]')
      const card = cards[index]

      if (!card) throw new Error(`No pricing card found at index ${index}`)

      return card
    },
    get freeCard() {
      return this.card(0)
    },
    get proCard() {
      return this.card(1)
    },
    async selectInterval(value: 'month' | 'lifetime') {
      await component.get(`[test-id="interval-${value}"]`).trigger('mousedown')
      await flushPromises()
    },
  }
}

describe('Pricing page', () => {
  beforeEach(() => {
    user.value = null
    products.value = [starter, proMonthly, proLifetime]
    isPending.value = false

    useFetch.mockResolvedValue({
      data: ref({ url: 'https://stripe.test/pay' }),
    })
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Pricing')
  })

  it('Should render the page copy', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(
      'pages.pricing.title',
    )
    expect(component.get('[test-id="description"]').text()).toBe(
      'pages.pricing.description',
    )
    expect(component.get('[test-id="text"]').text()).toBe('pages.pricing.text')
  })

  it('Should link to ko-fi to buy a coffee', async () => {
    const { component } = await mountPage()

    const link = component.get('[test-id="coffee"]')

    expect(link.attributes('href')).toBe('https://ko-fi.com/B0B2SSBBQ')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toContain('actions.buyCoffee')
  })

  it('Should render no cards while there are no products', async () => {
    products.value = undefined

    const { component } = await mountPage()

    expect(component.findAll('[test-id="product"]')).toHaveLength(0)
  })

  it('Should render exactly a free card and a pro card', async () => {
    const { titles } = await mountPage()

    expect(titles).toEqual(['Starter', 'Pro'])
  })

  it('Should default the interval toggle to lifetime for a visitor', async () => {
    const { proCard } = await mountPage()

    expect(proCard.get('[test-id="price"]').text()).toBe('€50')
    expect(proCard.text()).toContain('general.oneTime')
    expect(proCard.get('[test-id="interval-caption"]').text()).toBe(
      'pages.pricing.payOnceForever',
    )
  })

  it('Should default the interval toggle to the subscriber current plan', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'month',
    }

    const { proCard } = await mountPage()

    expect(proCard.get('[test-id="price"]').text()).toBe('€5')
    expect(proCard.text()).toContain('general.perMonth')
  })

  it('Should swap the price, suffix and caption when the toggle changes', async () => {
    const { proCard, selectInterval } = await mountPage()

    await selectInterval('month')

    expect(proCard.get('[test-id="price"]').text()).toBe('€5')
    expect(proCard.text()).toContain('general.perMonth')
    expect(proCard.get('[test-id="interval-caption"]').text()).toBe(
      'pages.pricing.cancelAnytime',
    )

    await selectInterval('lifetime')

    expect(proCard.get('[test-id="price"]').text()).toBe('€50')
    expect(proCard.text()).toContain('general.oneTime')
    expect(proCard.get('[test-id="interval-caption"]').text()).toBe(
      'pages.pricing.payOnceForever',
    )
  })

  it('Should show free instead of a price on the starter card', async () => {
    const { freeCard } = await mountPage()

    expect(freeCard.get('[test-id="price"]').text()).toBe('general.free')
  })

  it('Should show a skeleton instead of the price when the product has none', async () => {
    products.value = [starter, { ...proMonthly, price: undefined }, proLifetime]

    const { proCard, selectInterval } = await mountPage()
    await selectInterval('month')

    expect(proCard.find('[test-id="price"]').exists()).toBe(false)
    expect(proCard.get('[test-id="price-loading"]').text()).toBe('€')
  })

  it('Should render the benefits of a product with their icons', async () => {
    const { freeCard } = await mountPage()

    const benefits = freeCard.findAll('[test-id="benefit"]')

    expect(benefits).toHaveLength(3)
    expect(benefits[0]!.text()).toBe('pages.pricing.update')
    expect(benefits[0]!.get('.iconify').classes()).toEqual(
      expect.arrayContaining(['i-tabler:check', 'text-success']),
    )
    expect(benefits[1]!.text()).toBe('10 general.encounter')
    expect(benefits[2]!.get('.iconify').classes()).toEqual(
      expect.arrayContaining(['i-tabler:x', 'text-destructive']),
    )
  })

  it('Should show a skeleton instead of the cta while the products load', async () => {
    isPending.value = true

    const { proCard } = await mountPage()

    expect(proCard.find('[test-id="cta-loading"]').exists()).toBe(true)
    expect(proCard.find('[test-id="subscribe"]').exists()).toBe(false)
    expect(proCard.find('[test-id="current"]').exists()).toBe(false)
  })

  it('Should offer every product to a visitor without an account', async () => {
    const { component } = await mountPage()

    expect(component.findAll('[test-id="subscribe"]')).toHaveLength(2)
    expect(component.findAll('[test-id="current"]')).toHaveLength(0)
    expect(component.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.cta',
    )
  })

  it('Should mark the free product as current for a user without a subscription', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { freeCard, proCard } = await mountPage()

    expect(freeCard.get('[test-id="current"]').text()).toBe('general.current')
    expect(proCard.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.buy',
    )
  })

  it('Should offer subscribe on the monthly interval and buy on the lifetime interval for a free user', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { proCard, selectInterval } = await mountPage()

    await selectInterval('month')
    expect(proCard.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.subscribe',
    )

    await selectInterval('lifetime')
    expect(proCard.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.buy',
    )
  })

  it('Should not offer a product that has no stripe id', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }
    products.value = [starter, { ...proMonthly, id: undefined }, proLifetime]

    const { proCard, selectInterval } = await mountPage()
    await selectInterval('month')

    expect(proCard.find('[test-id="subscribe"]').exists()).toBe(false)
  })

  it('Should show current and a manage button for an active monthly subscriber', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'month',
      subscriptionStatus: 'active',
    }

    const { freeCard, proCard } = await mountPage()

    expect(proCard.get('[test-id="current"]').text()).toBe('general.current')
    expect(proCard.get('[test-id="manage"]').text()).toBe(
      'pages.profile.subscription.handle',
    )
    expect(freeCard.find('[test-id="subscribe"]').exists()).toBe(false)
    expect(freeCard.find('[test-id="current"]').exists()).toBe(false)
  })

  it('Should offer switching to lifetime for an active monthly subscriber', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'month',
      subscriptionStatus: 'active',
    }

    const { proCard, selectInterval } = await mountPage()
    await selectInterval('lifetime')

    expect(proCard.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.switchToLifetime',
    )
  })

  it('Should show a payment failed state and a manage button for a past due subscriber', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'month',
      subscriptionStatus: 'past_due',
    }

    const { proCard } = await mountPage()

    expect(proCard.get('[test-id="payment-failed"]').text()).toBe(
      'pages.pricing.paymentFailed',
    )
    expect(proCard.find('[test-id="current"]').exists()).toBe(false)
    expect(proCard.get('[test-id="manage"]').text()).toBe(
      'pages.profile.subscription.handle',
    )
  })

  it('Should offer no products to a lifetime subscriber', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'lifetime',
    }

    const { freeCard, proCard, component } = await mountPage()

    expect(proCard.get('[test-id="current"]').text()).toBe('general.current')
    expect(proCard.find('[test-id="manage"]').exists()).toBe(false)
    expect(freeCard.find('[test-id="current"]').exists()).toBe(false)
    expect(freeCard.find('[test-id="subscribe"]').exists()).toBe(false)
    expect(component.findAll('[test-id="subscribe"]')).toHaveLength(0)
  })

  it('Should start a stripe checkout for the clicked product', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { proCard, selectInterval } = await mountPage()
    await selectInterval('month')

    await proCard.get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(useFetch).toHaveBeenCalledWith(
      '/api/stripe/subscribe',
      {
        method: 'POST',
        body: { lookup: 'pro-monthly-lookup', locale: 'en' },
      },
      expect.any(String),
    )
    expect(navigateTo).toHaveBeenCalledWith('https://stripe.test/pay', {
      external: true,
    })
  })

  it('Should not redirect when stripe returns no checkout url', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    useFetch.mockResolvedValue({ data: ref(null) })

    const { proCard } = await mountPage()

    await proCard.get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should send the visitor to the login page when they are not signed in', async () => {
    const { proCard } = await mountPage()

    await proCard.get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(useFetch).not.toHaveBeenCalled()
  })

  it('Should open the billing portal from the manage button', async () => {
    user.value = {
      ...authUser,
      subscriptionType: 'pro',
      billingInterval: 'month',
      subscriptionStatus: 'active',
    }
    useFetch.mockResolvedValue({
      data: ref({ url: 'https://stripe.test/portal' }),
    })

    const { proCard } = await mountPage()

    await proCard.get('[test-id="manage"]').trigger('click')
    await flushPromises()

    expect(useFetch).toHaveBeenCalledWith(
      '/api/stripe/portal',
      { method: 'POST' },
      expect.any(String),
    )
    expect(navigateTo).toHaveBeenCalledWith('https://stripe.test/portal', {
      external: true,
    })
  })
})
