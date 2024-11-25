<script setup lang="ts">
defineProps<{
  text: string
  classes: string
  split: string
}>()
</script>

<template>
  <p>
    <template
      v-for="part in text.split(split)"
      :key="part"
    >
      {{ part }}
      <span :class="classes">
        {{ split }}
      </span>
    </template>
  </p>
</template>
