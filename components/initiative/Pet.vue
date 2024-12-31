<script setup lang="ts">
defineProps<{ pet: InitiativePet }>()
</script>

<template>
  <img
    :src="`/gifs/${pet}.gif`"
    loading="lazy"
    class="size-6"
  >
</template>
