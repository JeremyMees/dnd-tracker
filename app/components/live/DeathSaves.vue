<script setup lang="ts">
const props = defineProps<{
  saves: DndDeathSaves
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: [index: number, isSave: boolean]
}>()

const stabilized = computed(
  () => props.saves.save.every(Boolean) && !props.saves.fail.every(Boolean),
)

const dead = computed(
  () => props.saves.fail.every(Boolean) && !props.saves.save.every(Boolean),
)
</script>

<template>
  <div
    class="grid gap-1 w-fit"
    :class="{
      'bg-success/20 p-2 rounded-lg': stabilized,
      'bg-destructive/20 p-2 rounded-lg': dead,
    }"
  >
    <div
      v-for="(group, i) in [saves.save, saves.fail]"
      :key="`save-${i}`"
      class="grid grid-cols-3 gap-1 min-w-14"
    >
      <button
        v-for="(value, j) in group"
        :key="`${value}-${j}`"
        :test-id="i === 0 ? 'save' : 'fail'"
        type="button"
        :disabled="disabled"
        class="size-4 rounded border-2"
        :class="{
          'border-success bg-success/20': i === 0,
          'border-destructive bg-destructive/20': i === 1,
          'bg-success!': value && i === 0,
          'bg-destructive!': value && i === 1,
        }"
        @click="emit('toggle', j, i === 0)"
      />
    </div>
  </div>
</template>
