<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useSeo('Encounters')
</script>

<template>
  <NuxtLayout
    shadow
    container
  >
    <h1 class="pb-6">
      {{ $t('general.encounter', 2) }}
    </h1>
    <Encounters />
  </NuxtLayout>
</template>
