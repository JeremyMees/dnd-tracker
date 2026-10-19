<script setup lang="ts">
const props = defineProps<{
  label: string
  max: number
  used: number
}>()

const emit = defineEmits<{ 'update:used': [used: number] }>()

function toggle(index: number): void {
  emit('update:used', index < props.used ? index : index + 1)
}
</script>

<template>
  <div role="group" :aria-label="label" class="flex flex-wrap gap-1">
    <button
      v-for="i in max"
      :key="i"
      type="button"
      test-id="pip"
      :aria-label="`${label} ${i}`"
      :aria-pressed="i <= used"
      class="size-4 rounded-full border-2 border-primary transition-colors"
      :class="i <= used ? 'bg-primary' : 'bg-primary/20'"
      @click="toggle(i - 1)"
    />
  </div>
</template>
