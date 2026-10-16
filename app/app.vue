<script setup lang="ts">
const { dialogs, handlers } = useConfirmDialogs()
const route = useRoute()
const { locale } = useI18n()

useHealthCheck()

const pageName = computed<string>(() =>
  !route.name || typeof route.name !== 'string'
    ? ''
    : (route.name.split('___')[0] ?? ''),
)
</script>

<template>
  <AnimationMotionProvider>
    <TooltipProvider>
      <div>
        <a
          href="#main-content"
          test-id="skip-to-content"
          class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          {{ $t('actions.skipToContent') }}
        </a>
        <ConsentRoot :language="locale" />
        <NuxtRouteAnnouncer />
        <NuxtLoadingIndicator
          color="linear-gradient(to right,#7333E0 70%,#D926AA 100%)"
          error-color="#F87272"
        />

        <ClientOnly>
          <UiToaster />
          <ModalGroup />
          <LazyConfirmDialog
            v-for="dialog in dialogs"
            :key="dialog.uuid"
            v-bind="dialog"
            v-on="handlers"
          />
        </ClientOnly>

        <div
          :class="{
            'bg-primary/10': [
              'profile',
              'pricing',
              'updates-feature-request',
            ].includes(pageName),
          }"
          class="flex flex-col min-h-screen"
        >
          <NuxtPage />
        </div>
      </div>
    </TooltipProvider>
  </AnimationMotionProvider>
</template>
