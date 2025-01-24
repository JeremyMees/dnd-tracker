<script setup lang="ts">
const isShown = ref<boolean>(false)
const cookie = useCookie<number>('limit_cta')
const removeTimer = ref()
const day = 24 * 60 * 60 * 1000

defineExpose({ show })

onMounted(() => {
  setTimeout(() => checkShow(), 50)
  setAutoCloseTimer()
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
      class="fixed bottom-2 left-1/2 -translate-x-1/2 z-10 w-full max-w-prose"
    >
      <Card
        color="info"
        class="flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl"
      >
        <button
          class="absolute top-0 right-0 group"
          :aria-label="$t('actions.close')"
          @click="isShown=false"
        >
          <Icon
            name="tabler:x"
            class="text-destructive size-4 rounded-full ring-destructive group-focus-within:ring"
            aria-hidden="true"
          />
        </button>
        <p class="body-small">
          {{ $t('components.limitCta.text') }}
        </p>
        <div class="flex justify-end">
          <NuxtLinkLocale
            to="/pricing"
            class="btn-primary whitespace-nowrap"
          >
            {{ $t('components.limitCta.cta') }}
          </NuxtLinkLocale>
        </div>
      </Card>
    </div>
  </AnimationExpand>
</template>
