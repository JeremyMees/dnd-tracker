<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Successfully subscribed' })
</script>

<template>
  <NuxtLayout
    name="centered"
    shadow
  >
    Subscribe success
  </NuxtLayout>
</template>
