<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Profile' })
</script>

<template>
  <NuxtLayout shadow>
    Profile
  </NuxtLayout>
</template>
