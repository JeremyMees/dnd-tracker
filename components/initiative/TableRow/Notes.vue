<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

const note = ref<string>(props.item.note || '')

watchDebounced(note, () => {
  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = props.sheet.rows

  if (index === -1) return

  rows[index].note = note.value

  props.update({ rows })
}, { debounce: 500, maxWait: 1000 })
</script>

<template>
  <td class="min-w-[150px] relative">
    <textarea
      v-model="note"
      class="border-slate-700 border rounded-lg p-2 outline-none body-small bg-bg-light resize-vertical w-full h-10"
      maxlength="250"
    />
  </td>
</template>
