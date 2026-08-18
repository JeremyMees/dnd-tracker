<script setup lang="ts">
const props = defineProps<{
  band: DndHealthBand
}>()

const bandClass = computed(() => {
  if (props.band === 'healthy') {
    return 'border-success bg-success/20 text-success'
  }
  if (props.band === 'bloodied') {
    return 'border-warning bg-warning/20 text-warning'
  }
  return 'border-destructive bg-destructive/20 text-destructive'
})
</script>

<template>
  <UiBadge test-id="health-band" :class="bandClass">
    {{ $t(`general.${band}`) }}
  </UiBadge>
</template>
