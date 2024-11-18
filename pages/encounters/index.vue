<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useSeo('Encounters')

const { t } = useI18n()
</script>

<template>
  <NuxtLayout
    shadow
    container
  >
    <h1 class="pb-6">
      {{ t('general.encounters') }}
    </h1>
    <Encounters />
  </NuxtLayout>
</template>
