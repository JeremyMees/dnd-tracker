<script setup lang="ts">
defineProps<{ count: number, max: number }>()
</script>

<template>
  <span
    class="text-[12px] text-muted-foreground"
    :class="{ '!text-destructive': count >= max }"
  >
    {{ count }}/{{ max }}
  </span>
</template>
