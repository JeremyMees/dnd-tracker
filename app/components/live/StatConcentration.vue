<script setup lang="ts">
defineProps<{
  active?: boolean
  label?: boolean
}>()
</script>

<template>
  <span class="flex items-center gap-1">
    <Icon
      :name="active ? 'tabler:circle-filled' : 'tabler:circle-dotted'"
      class="size-4 min-w-4"
      aria-hidden="true"
    />
    <span v-if="label" class="text-xs">{{ $t('general.concentration') }}</span>
  </span>
</template>
