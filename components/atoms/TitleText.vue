<script setup lang="ts">
withDefaults(
  defineProps<{
    buttonLabel?: string
    buttonLink?: string
    center?: boolean
    sprite?: string
  }>(), {
    center: false,
    buttonLabel: '',
    buttonLink: '',
    sprite: undefined,
  },
)
</script>

<template>
  <div
    class="group"
    :class="{ 'text-center': center }"
  >
    <h2
      v-if="$slots.default"
      class="pb-4 relative max-w-max gradient-text"
      :class="{ 'mx-auto': center }"
    >
      <slot />
      <img
        v-if="sprite"
        :src="`/art/${sprite}.svg`"
        loading="lazy"
        class="w-10 h-10 absolute -right-12 -top-3 z-[-1] group-hover:rotate-12 transition-transform group-hover:scale-[1.2]"
      >
    </h2>
    <p
      v-if="$slots.text"
      class="max-w-prose text-muted-foreground"
      :class="{ 'mx-auto': center }"
    >
      <slot name="text" />
    </p>
    <div
      v-if="buttonLink && buttonLabel"
      class="flex mt-6"
      :class="[center ? 'justify-center' : 'justify-start']"
    >
      <NuxtLinkLocale :to="buttonLink">
        <button
          class="w-fit btn-primary"
          :aria-label="buttonLabel"
        >
          {{ buttonLabel }}
        </button>
      </NuxtLinkLocale>
    </div>
  </div>
</template>
