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

vi.mock('~~/queries/pricing', () => ({
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
  type: 'free',
  title: 'Starter',
  description: 'pages.pricing.starter',
  price: 0,
  isPopular: false,
  items: [
    { label: 'pages.pricing.update', icon: 'check' },
    { number: 10, label: 'general.encounter', icon: 'check' },
    { label: 'pages.pricing.live', icon: 'x' },
  ],
}

const medior: ProductPricing = {
  type: 'medior',
  title: 'Medior',
  description: 'pages.pricing.medior',
  price: 5,
  id: 'medior-lookup',
  isPopular: true,
  items: [{ number: 50, label: 'general.encounter', icon: 'check' }],
}

const pro: ProductPricing = {
  type: 'pro',
  title: 'Pro',
  description: 'pages.pricing.pro',
  price: 10,
  id: 'pro-lookup',
  isPopular: false,
  items: [{ number: 250, label: 'general.encounter', icon: 'check' }],
}

const upgrade: ProductPricing = {
  type: 'upgrade to pro',
  title: 'Upgrade to Pro',
  description: 'pages.pricing.pro',
  price: 5,
  id: 'upgrade-lookup',
  isPopular: false,
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
    card(title: string) {
      const card = component
        .findAll('[test-id="product"]')
        .find(item => item.get('[test-id="product-title"]').text() === title)

      if (!card) throw new Error(`No pricing card found for "${title}"`)

      return card
    },
  }
}

describe('Pricing page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    user.value = null
    products.value = [starter, medior, pro, upgrade]
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

  it('Should hide the upgrade product for users without a medior subscription', async () => {
    const { titles } = await mountPage()

    expect(titles).toEqual(['Starter', 'Medior', 'Pro'])
  })

  it('Should swap the pro product for the upgrade product for medior users', async () => {
    user.value = { ...authUser, subscriptionType: 'medior' }

    const { titles } = await mountPage()

    expect(titles).toEqual(['Starter', 'Medior', 'Upgrade to Pro'])
  })

  it('Should render the title, description and price of a product', async () => {
    const { card } = await mountPage()

    const product = card('Medior')

    expect(product.get('[test-id="product-description"]').text()).toBe(
      'pages.pricing.medior',
    )
    expect(product.get('[test-id="price"]').text()).toBe('€5')
    expect(product.text()).toContain('general.oneTime')
  })

  it('Should show a skeleton instead of the price when the product has none', async () => {
    products.value = [{ ...medior, price: undefined }]

    const { card } = await mountPage()

    const product = card('Medior')

    expect(product.find('[test-id="price"]').exists()).toBe(false)
    expect(product.get('[test-id="price-loading"]').text()).toBe('€')
  })

  it('Should mark only the popular product with a badge', async () => {
    const { card, component } = await mountPage()

    expect(component.findAll('[test-id="popular"]')).toHaveLength(1)
    expect(card('Medior').get('[test-id="popular"]').text()).toBe(
      'pages.pricing.popular',
    )
  })

  it('Should render the benefits of a product with their icons', async () => {
    const { card } = await mountPage()

    const benefits = card('Starter').findAll('[test-id="benefit"]')

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

    const { card } = await mountPage()

    const product = card('Medior')

    expect(product.find('[test-id="cta-loading"]').exists()).toBe(true)
    expect(product.find('[test-id="subscribe"]').exists()).toBe(false)
    expect(product.find('[test-id="current"]').exists()).toBe(false)
  })

  it('Should offer every product to a visitor without an account', async () => {
    const { component } = await mountPage()

    expect(component.findAll('[test-id="subscribe"]')).toHaveLength(3)
    expect(component.findAll('[test-id="current"]')).toHaveLength(0)
    expect(component.get('[test-id="subscribe"]').text()).toBe(
      'pages.pricing.cta',
    )
  })

  it('Should mark the free product as current for a user without a subscription', async () => {
    user.value = {
      ...authUser,
      subscriptionType: undefined,
    } as unknown as AuthUser

    const { card } = await mountPage()

    expect(card('Starter').get('[test-id="current"]').text()).toBe(
      'general.current',
    )
    expect(card('Medior').find('[test-id="subscribe"]').exists()).toBe(true)
    expect(card('Pro').find('[test-id="subscribe"]').exists()).toBe(true)
  })

  it('Should only offer the upgrade product to a medior user', async () => {
    user.value = { ...authUser, subscriptionType: 'medior' }

    const { card, component } = await mountPage()

    expect(card('Medior').find('[test-id="current"]').exists()).toBe(true)
    expect(card('Starter').find('[test-id="subscribe"]').exists()).toBe(false)
    expect(component.findAll('[test-id="subscribe"]')).toHaveLength(1)
    expect(card('Upgrade to Pro').find('[test-id="subscribe"]').exists()).toBe(
      true,
    )
  })

  it('Should offer no products to a pro user', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const { card, component } = await mountPage()

    expect(card('Pro').find('[test-id="current"]').exists()).toBe(true)
    expect(component.findAll('[test-id="subscribe"]')).toHaveLength(0)
  })

  it('Should not offer a product that has no stripe id', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }
    products.value = [{ ...medior, id: undefined }]

    const { card } = await mountPage()

    expect(card('Medior').find('[test-id="subscribe"]').exists()).toBe(false)
  })

  it('Should start a stripe checkout for the clicked product', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { card } = await mountPage()

    await card('Pro').get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(useFetch).toHaveBeenCalledWith(
      '/api/stripe/subscribe',
      { method: 'POST', body: { lookup: 'pro-lookup', locale: 'en' } },
      expect.any(String),
    )
    expect(navigateTo).toHaveBeenCalledWith('https://stripe.test/pay', {
      external: true,
    })
  })

  it('Should not redirect when stripe returns no checkout url', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    useFetch.mockResolvedValue({ data: ref(null) })

    const { card } = await mountPage()

    await card('Pro').get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should send the visitor to the login page when they are not signed in', async () => {
    const { card } = await mountPage()

    await card('Pro').get('[test-id="subscribe"]').trigger('click')
    await flushPromises()

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(useFetch).not.toHaveBeenCalled()
  })
})
