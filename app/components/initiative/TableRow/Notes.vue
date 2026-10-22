<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { patchRow } = validateInject(INITIATIVE_SHEET)

const note = ref<string>(props.item.note || '')

watch(
  () => props.item.note,
  newNote => {
    if (newNote !== note.value) note.value = newNote || ''
  },
)

watchDebounced(
  note,
  newValue => {
    patchRow(props.item.id, { note: newValue }).catch(() => undefined)
  },
  { debounce: 500, maxWait: 1000 },
)
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
