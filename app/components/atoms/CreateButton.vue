<script setup lang="ts">
defineEmits<{
  create: []
  hitLimit: []
}>()

defineProps<{
  allowCreate: boolean
  disabled?: boolean
  loading?: boolean
}>()
</script>

<template>
  <ClientOnly>
    <UiSkeleton
      v-if="loading"
      data-test-skeleton
      class="w-[120px] h-[47px]"
    />
    <button
      v-else
      class="btn-primary w-[120px]"
      :aria-label="$t('actions.create')"
      :disabled="disabled"
      @click="allowCreate ? $emit('create') : $emit('hitLimit')"
    >
      {{ $t('actions.create') }}
    </button>

    <template #fallback>
      <UiSkeleton class="w-[120px] h-[47px]" />
    </template>
  </ClientOnly>
</template>
