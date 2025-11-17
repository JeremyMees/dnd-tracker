<script setup lang="ts">
withDefaults(
  defineProps<{
    buttonLabel?: string
    buttonLink?: string
    center?: boolean
  }>(), {
    center: false,
    buttonLabel: '',
    buttonLink: '',
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
      class="pb-4 relative max-w-max"
      :class="{ 'mx-auto': center }"
    >
      <slot />
    </h2>
    <Motion
      as="p"
      :initial="{ transform: 'translateX(-50px)', opacity: 0 }"
      :in-view="{ transform: 'translateX(0px)', opacity: 1 }"
      :class="{ 'mx-auto': center }"
      class="max-w-prose text-muted-foreground"
    >
      <slot name="text" />
    </Motion>
    <Motion
      v-if="buttonLink && buttonLabel"
      as="div"
      :initial="{ transform: 'translateX(-50px)', opacity: 0 }"
      :in-view="{ transform: 'translateX(0px)', opacity: 1 }"
      :transition="{ delay: 0.2 }"
      :class="[center ? 'justify-center' : 'justify-start']"
      class="flex mt-6"
    >
      <NuxtLinkLocale :to="buttonLink">
        <UiButton
          class="w-fit"
          :aria-label="buttonLabel"
        >
          {{ buttonLabel }}
        </UiButton>
      </NuxtLinkLocale>
    </Motion>
  </div>
</template>
