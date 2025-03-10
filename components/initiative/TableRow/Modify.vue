<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

function copyRow(): void {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1) return

  props.update({
    rows: [
      ...rows,
      { ...props.item, id: crypto.randomUUID() },
    ],
  })
}

function deleteRow(): void {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  let rows = [...props.sheet.rows]

  if (index === -1) return

  rows = rows.filter(r => r.id !== props.item.id)

  props.update({ rows })
}
</script>

<template>
  <div class="flex items-center justify-end">
    <button
      v-tippy="$t('actions.copy')"
      :aria-label="$t('actions.copy')"
      class="icon-btn-info"
      @click="copyRow"
    >
      <Icon
        name="tabler:copy"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </button>
    <button
      v-tippy="$t('actions.delete')"
      :aria-label="$t('actions.delete')"
      class="icon-btn-destructive"
      @click="deleteRow"
    >
      <Icon
        name="tabler:trash"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </button>
  </div>
</template>
