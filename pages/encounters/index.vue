<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useSeo('Encounters')
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('general.encounter', 2)"
  >
    <Encounters />
  </NuxtLayout>
</template>
