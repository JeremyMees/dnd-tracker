<script setup lang="ts">
definePageMeta({ auth: true })
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
