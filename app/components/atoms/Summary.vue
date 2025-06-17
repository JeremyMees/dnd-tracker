<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    items?: string[]
  }>(),
  {
    title: '',
    items: () => [],
  },
)
</script>

<template>
  <div class="group relative">
    <h2
      v-if="title"
      class="pb-4 relative max-w-max"
    >
      {{ title }}
    </h2>
    <ul>
      <Motion
        v-for="(item, index) in items"
        :key="item"
        as="li"
        :initial="{ transform: 'translateX(-50px)', opacity: 0 }"
        :in-view="{ transform: 'translateX(0px)', opacity: 1 }"
        :transition="{ delay: index * 0.1 }"
        class="flex items-center gap-4"
      >
        <img
          src="/art/coin.svg"
          loading="lazy"
          alt="Coin"
          class="w-6 h-6"
        >
        <span class="text-muted-foreground">{{ item }}</span>
      </Motion>
    </ul>
  </div>
</template>
