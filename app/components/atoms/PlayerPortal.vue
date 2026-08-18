<script setup lang="ts">
const { locale } = useI18n({ useScope: 'global' })
const { appDomain } = useRuntimeConfig().public

const reduced = useReducedMotion()

const joinUrl = computed(() => `${appDomain}${localeParam(locale.value)}/live`)

const items = computed(() => [
  {
    icon: 'tabler:qrcode',
    title: 'pages.home.playerPortal.item1.title',
    text: 'pages.home.playerPortal.item1.text',
  },
  {
    icon: 'tabler:activity-heartbeat',
    title: 'pages.home.playerPortal.item2.title',
    text: 'pages.home.playerPortal.item2.text',
  },
  {
    icon: 'tabler:shield-half-filled',
    title: 'pages.home.playerPortal.item3.title',
    text: 'pages.home.playerPortal.item3.text',
  },
])

const enter = computed(() =>
  reduced.value ? undefined : { opacity: 0, y: 32 },
)
</script>

<template>
  <section class="dnd-container relative">
    <div
      class="grid items-center gap-12 lg:grid-cols-12 lg:gap-16"
      data-player-portal
    >
      <div class="lg:col-span-5">
        <Motion
          as="h3"
          :initial="enter"
          :while-in-view="{ opacity: 1, y: 0 }"
          :in-view-options="{ once: true, amount: 0.4 }"
          :transition="{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }"
          class="text-2xl font-black tracking-tight text-balance md:text-4xl"
        >
          {{ $t('pages.home.playerPortal.title') }}
        </Motion>

        <Motion
          as="p"
          :initial="enter"
          :while-in-view="{ opacity: 1, y: 0 }"
          :in-view-options="{ once: true, amount: 0.4 }"
          :transition="{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }"
          class="mt-5 max-w-prose text-muted-foreground"
        >
          {{ $t('pages.home.playerPortal.text') }}
        </Motion>

        <ul class="mt-10 flex flex-col gap-6">
          <Motion
            v-for="(item, index) in items"
            :key="item.title"
            as="li"
            test-id="portal-item"
            :initial="enter"
            :while-in-view="{ opacity: 1, y: 0 }"
            :in-view-options="{ once: true, amount: 0.6 }"
            :transition="{
              duration: 0.6,
              delay: 0.15 + index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }"
            class="flex gap-4"
          >
            <span
              class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border-4 border-primary bg-primary/30"
            >
              <Icon
                :name="item.icon"
                class="size-5 text-foreground"
                :aria-hidden="true"
              />
            </span>
            <span>
              <span class="head-6 block">{{ $t(item.title) }}</span>
              <span class="mt-1 block text-sm text-muted-foreground">
                {{ $t(item.text) }}
              </span>
            </span>
          </Motion>
        </ul>

        <UiButton as-child size="lg" variant="tertiary" class="mt-10">
          <NuxtLinkLocale test-id="portal-link" to="/live" class="w-fit">
            {{ $t('pages.home.playerPortal.button') }}
          </NuxtLinkLocale>
        </UiButton>
      </div>

      <Motion
        as="div"
        :initial="reduced ? undefined : { opacity: 0, y: 48 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :in-view-options="{ once: true, amount: 0.3 }"
        :transition="{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }"
        class="flex flex-col items-center gap-10 sm:flex-row sm:items-end sm:justify-center lg:col-span-7 lg:justify-end"
      >
        <div
          test-id="portal-qr"
          class="tracker-shadow w-[190px] shrink-0 -rotate-3 rounded-lg border-4 border-primary bg-background/80 p-3 backdrop-blur-lg"
        >
          <QrCode :value="joinUrl" class="mx-auto" />
          <p class="mt-2 text-center text-2xs text-muted-foreground">
            {{ $t('pages.home.playerPortal.qr') }}
          </p>
        </div>

        <UiPhoneMockup
          test-id="portal-image"
          src="/player-portal.png"
          class="h-auto w-[240px] shrink-0 rotate-2 drop-shadow-2xl md:w-[280px]"
        />
      </Motion>
    </div>
  </section>
</template>
