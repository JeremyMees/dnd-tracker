<script setup lang="ts">
defineEmits<{ openConditions: [] }>()

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

function removeEffect(name: string): void {
  const rows = props.sheet.rows

  props.update({
    rows: rows.map(row => row.id === props.item.id
      ? { ...row, conditions: row.conditions.filter(r => r.name !== name) }
      : row,
    ),
  })
}

function updateEffect(condition: InitiativeSheetRow['conditions'][0]): void {
  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = props.sheet.rows

  if (index === -1) return

  rows[index].conditions = rows[index].conditions.map(r => r.name === condition.name ? condition : r)

  props.update({ rows })
}
</script>

<template>
  <td>
    <div
      v-if="item.conditions.length"
      class="flex flex-wrap justify-center md:justify-start gap-1"
    >
      <Tag
        v-for="condition in item.conditions"
        :key="condition.name"
        removable
        :condition="condition"
        @update="updateEffect($event)"
        @remove="removeEffect($event)"
      />
    </div>
    <button
      v-else
      class="flex items-center gap-x-1"
      @click="$emit('openConditions')"
    >
      <Icon
        name="tabler:plus"
        class="size-5 min-w-5 text-secondary"
        aria-hidden="true"
      />
    </button>
  </td>
</template>
