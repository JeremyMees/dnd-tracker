<script setup lang="ts">
useSeo('No access')
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h2 test-id="title">
        {{ $t('pages.noAccess.title') }}
      </h2>
    </template>

    <p test-id="text" class="text-muted-foreground">
      {{ $t('pages.noAccess.text') }}
    </p>
  </NuxtLayout>
</template>
