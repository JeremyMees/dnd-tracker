<script setup lang="ts">
useSeo('No access')
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h2 data-test-title>
        {{ $t('pages.noAccess.title') }}
      </h2>
    </template>

    <p data-test-text class="text-muted-foreground">
      {{ $t('pages.noAccess.text') }}
    </p>
  </NuxtLayout>
</template>
