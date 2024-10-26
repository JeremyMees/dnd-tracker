<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Encounters' })
</script>

<template>
  <NuxtLayout shadow>
    Encounter overview
  </NuxtLayout>
</template>
