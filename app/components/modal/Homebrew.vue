<script setup lang="ts">
defineEmits<{ close: [] }>()

defineProps<{
  campaignId: number
  item?: HomebrewItemRow
}>()
</script>

<template>
  <FormHomebrew
    :campaign-id="campaignId"
    :item="item"
    @close="$emit('close')"
  />
</template>
