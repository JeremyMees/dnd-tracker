<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useSeo('Encounters')
</script>

<template>
  <NuxtLayout shadow>
    Encounter overview
  </NuxtLayout>
</template>
