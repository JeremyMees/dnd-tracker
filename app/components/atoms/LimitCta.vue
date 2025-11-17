<script setup lang="ts">
const isShown = ref<boolean>(false)
const cookie = useCookie<number>('limit_cta')
const removeTimer = ref()
const showTimer = ref()
const day = 24 * 60 * 60 * 1000

defineExpose({ show })

onMounted(() => {
  showTimer.value = setTimeout(() => checkShow(), 50)
  setAutoCloseTimer()
})

onBeforeUnmount(() => {
  if (removeTimer.value) clearTimeout(removeTimer.value)
  if (showTimer.value) clearTimeout(showTimer.value)
})

function setAutoCloseTimer(): void {
  removeTimer.value = setTimeout(() => {
    isShown.value = false
  }, 10000)
}

function show(): void {
  if (removeTimer.value) clearTimeout(removeTimer.value)

  isShown.value = true
  cookie.value = Date.now()

  setAutoCloseTimer()
}

function checkShow(): void {
  if (!cookie.value || isNaN(cookie.value)) show()
  else {
    const now = Date.now()
    if (now - cookie.value > day) show()
  }
}
</script>

<template>
  <AnimationExpand>
    <div
      v-if="isShown"
      data-test-cta
      class="fixed bottom-2 left-1/2 -translate-x-1/2 z-10 w-full max-w-prose"
    >
      <Card
        color="info"
        class="flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl px-6"
      >
        <UiButton
          data-test-close
          variant="secondary-ghost"
          size="icon-sm"
          :aria-label="$t('actions.close')"
          class="absolute top-0 right-0 group"
          @click="isShown=false"
        >
          <Icon
            name="tabler:x"
            aria-hidden="true"
          />
        </UiButton>
        <p class="text-sm">
          {{ $t('components.limitCta.text') }}
        </p>
        <div class="flex justify-end">
          <UiButton as-child>
            <NuxtLinkLocale
              to="/pricing"
              class="whitespace-nowrap"
            >
              {{ $t('components.limitCta.cta') }}
            </NuxtLinkLocale>
          </UiButton>
        </div>
      </Card>
    </div>
  </AnimationExpand>
</template>
