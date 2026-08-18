<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  title: string
  subtitle: string
  button: string
  class?: HTMLAttributes['class']
}>()

const { user } = useAuthentication()
const reduced = useReducedMotion()

const enter = computed(() =>
  reduced.value ? undefined : { opacity: 0, y: 28 },
)
</script>

<template>
  <section class="dnd-container">
    <div
      :class="
        cn(
          'relative overflow-hidden rounded-[32px] border-4 border-secondary bg-secondary/50 px-6 py-14 text-center backdrop-blur-lg md:px-14 md:py-20',
          props.class,
        )
      "
    >
      <Motion
        as="p"
        :initial="enter"
        :while-in-view="{ opacity: 1, y: 0 }"
        :in-view-options="{ once: true, amount: 0.4 }"
        :transition="{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }"
        class="mx-auto max-w-3xl text-2xl font-black tracking-tight text-balance text-foreground md:text-4xl"
      >
        {{ title }}
      </Motion>
      <Motion
        as="p"
        :initial="enter"
        :while-in-view="{ opacity: 1, y: 0 }"
        :in-view-options="{ once: true, amount: 0.4 }"
        :transition="{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }"
        class="mx-auto mt-5 max-w-prose text-lg text-pretty text-muted-foreground"
      >
        {{ subtitle }}
      </Motion>
      <Motion
        as="div"
        :initial="enter"
        :while-in-view="{ opacity: 1, y: 0 }"
        :in-view-options="{ once: true, amount: 0.4 }"
        :transition="{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }"
        class="mt-8 flex justify-center"
      >
        <UiButton as-child size="lg" variant="tertiary">
          <NuxtLinkLocale
            test-id="link"
            :to="user ? '/pricing' : '/login'"
            :style="false"
            class="w-fit"
          >
            {{ button }}
          </NuxtLinkLocale>
        </UiButton>
      </Motion>

      <UiBorderBeam
        :size="350"
        :duration="12"
        :border-width="4"
        color-from="#7434E3"
        color-to="#9B4BB3"
        class="rounded-[32px]"
      />
    </div>
  </section>
</template>
