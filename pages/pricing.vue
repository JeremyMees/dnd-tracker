<script setup lang="ts">
useSeo('Pricing')

const { locale, t } = useI18n({ useScope: 'global' })
const user = useAuthenticatedUser()
const localePath = useLocalePath()

const { data: products, isPending } = usePricingListing()

const labels = [
  'general.encounter',
  'general.campaign',
  'pages.pricing.multiple',
  'pages.pricing.live',
  'pages.pricing.update',
]

const shownProduct = computed<ProductPricing[]>(() => {
  if (!products.value) return []
  if (user.value?.subscription_type === 'medior') return products.value.filter(p => p.type !== 'pro')
  else return products.value.filter(p => p.type !== 'upgrade to pro')
})

async function subscribe(id: string, type: StripeSubscriptionType): Promise<void> {
  if (!user.value) navigateTo(localePath('/login'))

  const { data } = await useFetch('/api/stripe/subscribe', {
    method: 'POST',
    body: {
      user: user.value,
      lookup: id,
      locale: locale.value,
      type,
      ...(user.value?.stripe_id && { customer: user.value.stripe_id }),
    },
  })

  if (data.value) navigateTo(data.value.url, { external: true })
}

function isCurrent(type: StripeSubscriptionType): boolean {
  if (!user.value) return false
  return type === (user.value.subscription_type || 'free')
}

function isUpgradeable(type: StripeSubscriptionType): boolean {
  const current = user.value?.subscription_type || 'free'
  if (current === 'free') return true
  return type === 'upgrade to pro' && current === 'medior'
}
</script>

<template>
  <NuxtLayout
    shadow
    container
  >
    <section class="mb-8 lg:mb-12">
      <h1 class="mb-4 sm:text-4xl xl:text-5xl text-center text-foreground">
        {{ t('pages.pricing.title') }}
      </h1>
      <p class="mb-16 max-w-3xl mx-auto text-center text-muted-foreground">
        {{ t('pages.pricing.description') }}
      </p>
      <div class="relative max-w-4xl mx-auto py-20">
        <img
          src="/gifs/dragon.gif"
          loading="lazy"
          class="w-8 h-8 absolute top-12 left-20"
        >
        <div class="inline-block overflow-x-auto w-full">
          <Card
            color="primary"
            class="bg-primary/20 backdrop-blur-lg !rounded-[32px] tracker-shadow-inset overflow-y-hidden"
          >
            <table class="min-w-full">
              <thead>
                <tr>
                  <th
                    v-for="(header, index) in [
                      undefined,
                      ...shownProduct.map(({ title, price }) => { return { title, price } }),
                    ]"
                    :key="index"
                    class="py-3 px-2 border-b border-primary"
                  >
                    <div
                      v-if="header"
                      class="flex flex-col text-xl"
                    >
                      <span>
                        {{ header.title }}
                      </span>
                      <UiSkeleton
                        v-if="isPending"
                        class="w-[140px] mx-auto h-8 relative top-1"
                      />
                      <div
                        v-else-if="header.price !== undefined"
                        class="font-extrabold flex flex-col items-center"
                      >
                        <span>{{ header.price }}€</span>
                        <span class="body-small">{{ t('general.oneTime') }} </span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in labels"
                  :key="item"
                  class="border-b last:border-b-0 border-primary"
                >
                  <td class="px-2 py-3 font-bold">
                    {{ t(item, 2) }}
                  </td>
                  <td
                    v-for="product in shownProduct"
                    :key="product.type"
                    class="px-2 py-1 text-center font-bold"
                  >
                    <span v-if="product.items[index].number">
                      {{ product.items[index].number }}
                    </span>
                    <Icon
                      v-else
                      :name="product.items[index].icon === 'check' ? 'tabler:check' : 'tabler:x'"
                      class="w-8 h-8"
                      :class="[product.items[index].icon === 'check' ? 'text-success' : 'text-destructive']"
                      aria-hidden="true"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="px-2 py-1" />
                  <td
                    v-for="product in shownProduct"
                    :key="product.type"
                    class="px-2 py-1 text-center font-bold"
                  >
                    <UiSkeleton
                      v-if="isPending"
                      class="h-12 rounded-lg w-full"
                    />
                    <div
                      v-else-if="isCurrent(product.type)"
                      class="btn-success w-full"
                    >
                      {{ t('general.current') }}
                    </div>
                    <button
                      v-else-if="!user || (product.id && product.price !== 0 && isUpgradeable(product.type))"
                      class="btn-tertiary w-full"
                      :aria-label="t('pages.pricing.cta')"
                      :disabled="isPending"
                      @click="subscribe(product?.id || '', product.type)"
                    >
                      {{ t('pages.pricing.cta') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      <p class="mb-5 max-w-3xl mx-auto text-center pt-12 text-muted-foreground">
        {{ t('pages.pricing.text') }}
      </p>
      <div class="flex justify-center">
        <a
          href="https://ko-fi.com/B0B2SSBBQ"
          target="_blank"
        >
          <div class="btn-primary flex items-center gap-4">
            <span>
              {{ t('actions.buyCoffee') }}
            </span>
            <Icon
              name="tabler:coffee"
              class="size-5"
              aria-hidden="true"
            />
          </div>
        </a>
      </div>
    </section>
  </NuxtLayout>
</template>
