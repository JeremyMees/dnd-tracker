<script setup lang="ts">
useSeo('No access')

const { t } = useI18n()
</script>

<template>
  <NuxtLayout name="centered">
    <h2>
      {{ t('pages.noAccess.title') }}
    </h2>
    <p class="mt-4">
      {{ t('pages.noAccess.text') }}
    </p>
  </NuxtLayout>
</template>
