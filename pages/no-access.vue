<script setup lang="ts">
useSeo('No access')
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h2>
        {{ $t('pages.noAccess.title') }}
      </h2>
    </template>

    <p>
      {{ $t('pages.noAccess.text') }}
    </p>
  </NuxtLayout>
</template>
