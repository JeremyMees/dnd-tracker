<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    max: number
    used: number
    disabled?: boolean
    variant?: 'primary' | 'success' | 'destructive'
  }>(),
  { disabled: false, variant: 'primary' },
)

const emit = defineEmits<{ 'update:used': [used: number] }>()

const variants = {
  primary: {
    border: 'border-primary',
    used: 'bg-primary',
    free: 'bg-primary/20',
  },
  success: {
    border: 'border-success',
    used: 'bg-success',
    free: 'bg-success/20',
  },
  destructive: {
    border: 'border-destructive',
    used: 'bg-destructive',
    free: 'bg-destructive/20',
  },
}

const colors = computed(() => variants[props.variant])

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
      :disabled="disabled"
      class="size-4 rounded-full border-2 transition-colors disabled:cursor-not-allowed"
      :class="[colors.border, i <= used ? colors.used : colors.free]"
      @click="toggle(i - 1)"
    />
  </div>
</template>
