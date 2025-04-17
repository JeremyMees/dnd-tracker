<script setup lang="ts">
import confetti from 'canvas-confetti'

definePageMeta({ auth: true })

useSeo('Successfully subscribed')

onMounted(() => {
  const duration = 5 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      clearInterval(interval)
      return
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)
})
</script>

<template>
  <NuxtLayout
    name="centered"
    shadow
  >
    <template #header>
      <h1>
        {{ $t('pages.subscribeSuccess.title') }}
      </h1>
    </template>
    <p class="text-muted-foreground">
      {{ $t('pages.subscribeSuccess.description') }}
    </p>
  </NuxtLayout>
</template>
