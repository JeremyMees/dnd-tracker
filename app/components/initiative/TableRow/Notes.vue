<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const note = ref<string>(props.item.note || '')

watchDebounced(note, () => {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = {
    ...rows[index],
    note: note.value,
  }

  props.update({ rows })
}, { debounce: 500, maxWait: 1000 })
</script>

<template>
  <div class="min-w-[150px] h-full relative">
    <textarea
      v-model="note"
      class="border-background border rounded-lg p-1 outline-none text-sm bg-muted resize-vertical w-full h-full min-h-10 max-h-[200px]"
      maxlength="250"
    />
  </div>
</template>
