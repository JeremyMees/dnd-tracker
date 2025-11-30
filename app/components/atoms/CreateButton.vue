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
      class="w-[70px] h-[32px]"
    />
    <UiButton
      v-else
      size="sm"
      :aria-label="$t('actions.create')"
      :disabled="disabled"
      @click="allowCreate ? $emit('create') : $emit('hitLimit')"
    >
      {{ $t('actions.create') }}
    </UiButton>

    <template #fallback>
      <UiSkeleton class="w-[70px] h-[32px]" />
    </template>
  </ClientOnly>
</template>
