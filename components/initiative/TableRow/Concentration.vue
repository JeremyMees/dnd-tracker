<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

function updateConcentration(): void {
  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = props.sheet.rows

  if (index === -1) return

  rows[index].concentration = !rows[index].concentration

  props.update({ rows })
}
</script>

<template>
  <td>
    <button
      v-if="item.type !== 'lair'"
      v-tippy="$t('general.concentration')"
      :aria-label="$t('general.concentration')"
      class="icon-btn-primary mx-auto"
      @click="updateConcentration"
    >
      <Icon
        :name="`tabler:${item.concentration ? 'brain' : 'point'}`"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </button>
  </td>
</template>
