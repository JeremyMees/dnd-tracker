<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    amount?: number
  }>(), {
    rows: 2,
    amount: 10,
  },
)
</script>

<template>
  <ul
    class="grid list-inside gap-x-6"
    :style="{
      gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))`,
    }"
  >
    <div
      v-for="i in rows"
      :key="i"
      class="flex flex-col gap-1"
    >
      <li
        v-for="j in amount"
        :key="j"
      >
        <div class="animate-pulse rounded-lg bg-tracker/50 h-6 border-4 border-tracker" />
      </li>
    </div>
  </ul>
</template>
