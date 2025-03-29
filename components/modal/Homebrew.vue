<script setup lang="ts">
defineEmits<{ close: [] }>()

defineProps<{
  campaignId: number
  count: number
  item?: HomebrewItemRow
}>()
</script>

<template>
  <FormHomebrew
    :campaign-id="campaignId"
    :count="count"
    :item="item"
    @close="$emit('close')"
  />
</template>
