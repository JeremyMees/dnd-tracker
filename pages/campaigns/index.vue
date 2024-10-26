<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Campaigns' })
</script>

<template>
  <NuxtLayout shadow>
    Campaign overview
  </NuxtLayout>
</template>
