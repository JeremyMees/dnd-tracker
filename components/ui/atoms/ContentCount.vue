<script setup lang="ts">
defineProps<{ count: number, max: number }>()
</script>

<template>
  <span
    class="text-[12px] text-slate-300"
    :class="{ '!text-danger': count >= max }"
  >
    {{ count }}/{{ max }}
  </span>
</template>
