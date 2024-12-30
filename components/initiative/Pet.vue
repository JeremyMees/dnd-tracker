<script setup lang="ts">
defineProps<{
  pet: 'cat' | 'chicken' | 'barmaid' | 'crawler' | 'dragon' | 'fairy' | 'redcap' | 'wolf-rider'
}>()
</script>

<template>
  <img
    :src="`/gifs/${pet}.gif`"
    loading="lazy"
    class="size-8"
  >
</template>
