<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useSeo('Successfully subscribed')
</script>

<template>
  <NuxtLayout
    name="centered"
    shadow
  >
    Subscribe success
  </NuxtLayout>
</template>
