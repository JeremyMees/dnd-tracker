<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    radialGradient?: boolean
    class?: string
  }>(), {
    radialGradient: true,
  },
)

const animation = ref(false)

onMounted(() => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  animation.value = !isSafari
})
</script>

<template>
  <main>
    <div
      v-bind="props"
      :class="
        cn(
          'relative flex flex-col h-[100vh] items-center justify-center bg-transparent transition-bg',
          props.class,
        )
      "
    >
      <div class="absolute inset-0 overflow-hidden">
        <div
          :class="
            cn(
              'filter blur-[10px] invert pointer-events-none absolute -inset-[10px] opacity-50 will-change-transform;',
              '[--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]',
              '[--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]',
              '[--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]',
              '[background-image:var(--white-gradient),var(--aurora)] dark:[background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%]',
              'aurora-background-gradient-after',
              animation ? 'aurora-gradient-animation' : '',
              props.radialGradient
                && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
            )
          "
        />
      </div>
      <slot />
    </div>
  </main>
</template>

<style scoped>
.aurora-background-gradient-after {
  @apply after:content-[""]
          after:absolute
          after:inset-0
          after:[background-image:var(--white-gradient),var(--aurora)]
          after:dark:[background-image:var(--dark-gradient),var(--aurora)]
          after:[background-size:200%,_100%]
          after:[background-attachment:fixed]
          after:mix-blend-difference;
}

.aurora-gradient-animation::after {
  animation: animate-aurora 60s linear infinite;
}

@keyframes animate-aurora {
  0% {
    background-position:
      50% 50%,
      50% 50%;
  }
  100% {
    background-position:
      350% 50%,
      350% 50%;
  }
}
</style>
