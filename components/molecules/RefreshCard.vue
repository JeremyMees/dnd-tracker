<script setup lang="ts">
defineEmits<{ refresh: [] }>()
</script>

<template>
  <Card
    color="danger"
    class="w-full max-w-prose mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
  >
    <h2 class="text-center">
      {{ $t('general.error.text') }}
    </h2>
    <button
      class="btn-foreground"
      :aria-label="$t('actions.tryAgain')"
      @click="$emit('refresh')"
    >
      {{ $t('actions.tryAgain') }}
    </button>
  </Card>
</template>
