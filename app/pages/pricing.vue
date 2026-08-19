<script setup lang="ts">
import { usePricingListing } from '~/queries/pricing'

useSeo('Pricing')

const { locale, t } = useI18n({ useScope: 'global' })
const { user } = useAuthentication()
const localePath = useLocalePath()

const { data: products, isPending } = usePricingListing()

const freeProduct = computed(() => products.value?.find(p => p.key === 'free'))
const proMonthly = computed(() =>
  products.value?.find(p => p.key === 'pro_monthly'),
)
const proLifetime = computed(() =>
  products.value?.find(p => p.key === 'pro_lifetime'),
)

const intervalOverride = ref<BillingInterval | null>(null)
const defaultInterval = computed<BillingInterval>(() =>
  user.value?.subscriptionType === 'pro' && user.value.billingInterval
    ? user.value.billingInterval
    : 'lifetime',
)
const selectedInterval = computed<BillingInterval>({
  get: () => intervalOverride.value ?? defaultInterval.value,
  set: value => (intervalOverride.value = value),
})

const activePro = computed(() =>
  selectedInterval.value === 'month' ? proMonthly.value : proLifetime.value,
)

const isPastDue = computed(() => user.value?.subscriptionStatus === 'past_due')

function isCurrent(product: ProductPricing | undefined): boolean {
  if (!product || !user.value) return false
  if (product.key === 'free') return user.value.subscriptionType === 'free'
  return (
    user.value.subscriptionType === 'pro' &&
    user.value.billingInterval === product.interval
  )
}

function showManage(product: ProductPricing | undefined): boolean {
  return product?.key === 'pro_monthly' && isCurrent(product)
}

function canPurchase(product: ProductPricing | undefined): boolean {
  if (!product) return false
  if (!user.value) return true
  if (product.key === 'free' || isCurrent(product)) return false
  if (!product.id || !product.price) return false
  if (
    user.value.subscriptionType === 'pro' &&
    user.value.billingInterval === 'lifetime'
  )
    return false
  if (product.key === 'pro_monthly')
    return user.value.subscriptionType === 'free'
  return true
}

function ctaLabel(product: ProductPricing | undefined): string {
  if (!product) return ''
  if (!user.value) return t('pages.pricing.cta')
  if (product.key === 'pro_lifetime' && user.value.subscriptionType === 'pro')
    return t('pages.pricing.switchToLifetime')
  if (product.key === 'pro_lifetime') return t('pages.pricing.buy')
  return t('pages.pricing.subscribe')
}

async function subscribe(id: string): Promise<void> {
  if (!user.value) {
    navigateTo(localePath('/login'))
    return
  }

  const { data } = await useFetch('/api/stripe/subscribe', {
    method: 'POST',
    body: {
      lookup: id,
      locale: locale.value,
    },
  })

  if (data.value) navigateTo(data.value.url, { external: true })
}

async function manageBilling(): Promise<void> {
  const { data } = await useFetch('/api/stripe/portal', { method: 'POST' })

  if (data.value) navigateTo(data.value.url, { external: true })
}
</script>

<template>
  <NuxtLayout shadow container>
    <section class="mb-8 lg:mb-12">
      <h1
        test-id="title"
        class="mb-4 sm:text-4xl xl:text-5xl text-center max-w-3xl mx-auto"
      >
        {{ t('pages.pricing.title') }}
      </h1>
      <p
        test-id="description"
        class="mb-16 max-w-xl mx-auto text-center text-muted-foreground"
      >
        {{ t('pages.pricing.description') }}
      </p>

      <UiTabs
        v-model="selectedInterval"
        test-id="interval"
        class="w-fit mx-auto"
      >
        <UiTabsList class="grid grid-cols-2">
          <UiTabsTrigger test-id="interval-month" value="month">
            {{ $t('general.monthly') }}
          </UiTabsTrigger>
          <UiTabsTrigger test-id="interval-lifetime" value="lifetime">
            {{ $t('pages.pricing.lifetime') }}
          </UiTabsTrigger>
        </UiTabsList>
      </UiTabs>

      <Motion
        as="div"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        class="relative grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto py-8 mt-8 mb-16"
      >
        <img
          src="/gifs/dragon.gif"
          loading="lazy"
          class="size-8 absolute top-0 left-20"
        />

        <Motion
          v-if="freeProduct"
          as-child
          :animate="{ opacity: 1, y: 0 }"
          :initial="{ opacity: 0, y: 50 }"
        >
          <UiCard test-id="product" class="h-full flex flex-col">
            <UiCardHeader>
              <UiCardTitle class="pb-2 text-3xl">
                <span test-id="product-title">
                  {{ freeProduct.title }}
                </span>
              </UiCardTitle>

              <UiCardDescription test-id="product-description" class="pb-4">
                {{ $t(freeProduct.description) }}
              </UiCardDescription>

              <span test-id="price" class="text-2xl font-bold">
                {{ $t('general.free') }}
              </span>
            </UiCardHeader>

            <UiCardContent class="flex-1">
              <div class="space-y-4">
                <span
                  v-for="(benefit, j) in freeProduct.items"
                  :key="j"
                  test-id="benefit"
                  class="flex items-center gap-2 text-sm dark:text-muted-foreground"
                >
                  <Icon
                    v-if="benefit.icon"
                    :name="
                      benefit.icon === 'check' ? 'tabler:check' : 'tabler:x'
                    "
                    :class="
                      benefit.icon === 'check'
                        ? 'text-success'
                        : 'text-destructive'
                    "
                  />
                  {{ benefit.number }}
                  {{ $t(benefit.label || '', 2) }}
                </span>
              </div>
            </UiCardContent>

            <UiCardFooter class="flex flex-col gap-2 mt-auto">
              <UiSkeleton
                v-if="isPending"
                test-id="cta-loading"
                class="h-[52px] rounded-lg w-full"
              />
              <UiButton
                v-else-if="isCurrent(freeProduct)"
                test-id="current"
                variant="success"
                class="w-full"
              >
                {{ t('general.current') }}
              </UiButton>
              <UiButton
                v-else-if="canPurchase(freeProduct)"
                test-id="subscribe"
                :aria-label="t('pages.pricing.cta')"
                :disabled="isPending"
                variant="tertiary"
                class="w-full"
                @click="subscribe('')"
              >
                {{ t('pages.pricing.cta') }}
              </UiButton>
            </UiCardFooter>
          </UiCard>
        </Motion>

        <Motion
          v-if="activePro"
          as-child
          :animate="{ opacity: 1, y: 0, transition: { delay: 0.2 } }"
          :initial="{ opacity: 0, y: 50 }"
        >
          <UiCard test-id="product" class="h-full flex flex-col">
            <UiCardHeader>
              <UiCardTitle class="pb-2 text-3xl">
                <span test-id="product-title">
                  {{ activePro.title }}
                </span>
              </UiCardTitle>

              <UiCardDescription test-id="product-description" class="pb-4">
                {{ $t(activePro.description) }}
              </UiCardDescription>

              <div class="flex items-end gap-1">
                <span class="text-2xl font-bold">
                  <span
                    v-if="!isDefined(activePro.price)"
                    test-id="price-loading"
                    class="flex items-center"
                  >
                    €<UiSkeleton class="w-[30px] h-[34px]" />
                  </span>
                  <span v-else test-id="price">€{{ activePro.price }}</span>
                </span>
                <span class="text-muted-foreground">
                  /{{
                    $t(
                      selectedInterval === 'month'
                        ? 'general.perMonth'
                        : 'general.oneTime',
                    )
                  }}</span
                >
              </div>
              <p
                test-id="interval-caption"
                class="text-sm text-muted-foreground pt-1"
              >
                {{
                  selectedInterval === 'month'
                    ? $t('pages.pricing.cancelAnytime')
                    : $t('pages.pricing.payOnceForever')
                }}
              </p>
            </UiCardHeader>

            <UiCardContent class="flex-1">
              <div class="space-y-4">
                <span
                  v-for="(benefit, j) in activePro.items"
                  :key="j"
                  test-id="benefit"
                  class="flex items-center gap-2 text-sm dark:text-muted-foreground"
                >
                  <Icon
                    v-if="benefit.icon"
                    :name="
                      benefit.icon === 'check' ? 'tabler:check' : 'tabler:x'
                    "
                    :class="
                      benefit.icon === 'check'
                        ? 'text-success'
                        : 'text-destructive'
                    "
                  />
                  {{ benefit.number }}
                  {{ $t(benefit.label || '', 2) }}
                </span>
              </div>
            </UiCardContent>

            <UiCardFooter class="flex flex-col gap-2 mt-auto">
              <UiSkeleton
                v-if="isPending"
                test-id="cta-loading"
                class="h-[52px] rounded-lg w-full"
              />
              <template v-else-if="isCurrent(activePro)">
                <UiButton
                  v-if="activePro.key === 'pro_monthly' && isPastDue"
                  test-id="payment-failed"
                  variant="destructive"
                  class="w-full"
                >
                  {{ t('pages.pricing.paymentFailed') }}
                </UiButton>
                <UiButton
                  v-else
                  test-id="current"
                  variant="success"
                  class="w-full"
                >
                  {{ t('general.current') }}
                </UiButton>
                <UiButton
                  v-if="showManage(activePro)"
                  test-id="manage"
                  variant="secondary-ghost"
                  class="w-full"
                  @click="manageBilling"
                >
                  {{ t('pages.profile.subscription.handle') }}
                </UiButton>
              </template>
              <UiButton
                v-else-if="canPurchase(activePro)"
                test-id="subscribe"
                :aria-label="ctaLabel(activePro)"
                :disabled="isPending"
                variant="tertiary"
                class="w-full"
                @click="subscribe(activePro?.id || '')"
              >
                {{ ctaLabel(activePro) }}
              </UiButton>
            </UiCardFooter>
          </UiCard>
        </Motion>
      </Motion>
      <p
        test-id="text"
        class="mb-5 max-w-3xl mx-auto text-center pt-12 text-muted-foreground"
      >
        {{ t('pages.pricing.text') }}
      </p>
      <div class="flex justify-center">
        <UiButton as-child>
          <NuxtLink
            test-id="coffee"
            href="https://ko-fi.com/B0B2SSBBQ"
            target="_blank"
            class="flex items-center gap-4"
          >
            <span>
              {{ t('actions.buyCoffee') }}
            </span>
            <Icon name="tabler:coffee" class="size-5" aria-hidden="true" />
          </NuxtLink>
        </UiButton>
      </div>
    </section>
  </NuxtLayout>
</template>
