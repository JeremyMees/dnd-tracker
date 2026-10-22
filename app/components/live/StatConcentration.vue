<script setup lang="ts">
defineProps<{
  active?: boolean
  label?: boolean
}>()
</script>

<template>
  <span class="flex items-center gap-1">
    <UsePips
      :label="$t('general.concentration')"
      :max="1"
      :used="active ? 1 : 0"
      disabled
    />
    <span v-if="label" class="text-xs">{{ $t('general.concentration') }}</span>
  </span>
</template>
