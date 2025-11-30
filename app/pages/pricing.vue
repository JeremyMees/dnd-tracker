<script setup lang="ts">
import { usePricingListing } from '~~/queries/pricing'

useSeo('Pricing')

const { locale, t } = useI18n({ useScope: 'global' })
const { user } = useAuthentication()
const localePath = useLocalePath()

const { data: products, isPending } = usePricingListing()

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
      <h1 class="mb-4 sm:text-4xl xl:text-5xl text-center max-w-3xl mx-auto">
        {{ t('pages.pricing.title') }}
      </h1>
      <p class="mb-16 max-w-xl mx-auto text-center text-muted-foreground">
        {{ t('pages.pricing.description') }}
      </p>

      <Motion
        as="div"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        class="relative grid grid-cols-1 md:grid-cols-3 gap-4 py-8 my-16"
      >
        <img
          src="/gifs/dragon.gif"
          loading="lazy"
          class="size-8 absolute top-0 left-20"
        >
        <Motion
          v-for="(product, i) in shownProduct"
          :key="product.title"
          as-child
          :animate="{
            opacity: 1,
            y: 0,
            transition: {
              delay: i * 0.2,
            },
          }"
          :initial="{
            opacity: 0,
            y: 50,
          }"
        >
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="pb-2 flex items-center justify-between">
                <span>
                  {{ product.title }}
                </span>
                <UiBadge
                  v-if="product.isPopular"
                  variant="muted"
                >
                  {{ $t('pages.pricing.popular') }}
                </UiBadge>
              </UiCardTitle>

              <UiCardDescription class="pb-4">
                {{ product.description }}
              </UiCardDescription>

              <div class="flex items-end gap-1">
                <span class="text-3xl font-bold">
                  <span
                    v-if="!isDefined(product.price)"
                    class="flex items-center"
                  >
                    €<UiSkeleton class="w-[30px] h-[34px]" />
                  </span>
                  <span v-else>€{{ product.price }}</span>
                </span>
                <span class="text-muted-foreground"> /{{ $t('general.oneTime') }}</span>
              </div>
            </UiCardHeader>

            <UiCardContent class="flex">
              <div class="space-y-4">
                <span
                  v-for="(benefit, j) in product.items"
                  :key="j"
                  class="flex items-center gap-2 text-sm dark:text-muted-foreground"
                >
                  <Icon
                    v-if="benefit.icon"
                    :name="`tabler:${benefit.icon}`"
                    :class="benefit.icon === 'check' ? 'text-success' : 'text-destructive'"
                  />
                  {{ benefit.number }}
                  {{ $t(benefit.label || '', 2) }}
                </span>
              </div>
            </UiCardContent>

            <UiCardFooter>
              <UiSkeleton
                v-if="isPending"
                class="h-[52px] rounded-lg w-full"
              />
              <UiButton
                v-else-if="isCurrent(product.type)"
                variant="success"
                class="w-full"
              >
                {{ t('general.current') }}
              </UiButton>
              <UiButton
                v-else-if="!user || (product.id && product.price !== 0 && isUpgradeable(product.type))"
                :aria-label="t('pages.pricing.cta')"
                :disabled="isPending"
                variant="tertiary"
                class="w-full"
                @click="subscribe(product?.id || '', product.type)"
              >
                {{ t('pages.pricing.cta') }}
              </UiButton>
            </UiCardFooter>
          </UiCard>
        </Motion>
      </Motion>
      <p class="mb-5 max-w-3xl mx-auto text-center pt-12 text-muted-foreground">
        {{ t('pages.pricing.text') }}
      </p>
      <div class="flex justify-center">
        <UiButton as-child>
          <NuxtLink
            href="https://ko-fi.com/B0B2SSBBQ"
            target="_blank"
            class="flex items-center gap-4"
          >
            <span>
              {{ t('actions.buyCoffee') }}
            </span>
            <Icon
              name="tabler:coffee"
              class="size-5"
              aria-hidden="true"
            />
          </NuxtLink>
        </UiButton>
      </div>
    </section>
  </NuxtLayout>
</template>
