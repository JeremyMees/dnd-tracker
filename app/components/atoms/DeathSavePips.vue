<script setup lang="ts">
const props = defineProps<{
  saves: DndDeathSaves
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:saves': [saves: DndDeathSaves, type: 'save' | 'fail']
}>()

const groups = [
  { type: 'save', variant: 'success' },
  { type: 'fail', variant: 'destructive' },
] as const

const stabilized = computed(
  () => props.saves.save.every(Boolean) && !props.saves.fail.every(Boolean),
)

const dead = computed(
  () => props.saves.fail.every(Boolean) && !props.saves.save.every(Boolean),
)

function update(type: 'save' | 'fail', count: number): void {
  emit('update:saves', setDeathSaveCount(props.saves, type, count), type)
}
</script>

<template>
  <div
    class="grid gap-1 w-fit"
    :class="{
      'bg-success/20 p-2 rounded-lg': stabilized,
      'bg-destructive/20 p-2 rounded-lg': dead,
    }"
  >
    <UsePips
      v-for="group in groups"
      :key="group.type"
      :test-id="group.type"
      :label="$t(`components.deathSaves.${group.type}`)"
      :max="saves[group.type].length"
      :used="saves[group.type].filter(Boolean).length"
      :variant="group.variant"
      :disabled="disabled"
      @update:used="update(group.type, $event)"
    />
  </div>
</template>
