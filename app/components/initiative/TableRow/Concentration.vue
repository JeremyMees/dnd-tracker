<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

function updateConcentration(): void {
  if (!props.sheet) return
  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], concentration: !props.item.concentration }

  props.update({ rows })
}
</script>

<template>
  <button
    v-if="item.type !== 'lair'"
    v-tippy="$t('general.concentration')"
    :aria-label="$t('general.concentration')"
    class="icon-btn-primary mx-auto"
    @click="updateConcentration"
  >
    <Icon
      :name="`tabler:${item.concentration ? 'circle-filled' : 'circle-dotted'}`"
      :aria-hidden="true"
      class="size-5 min-w-5"
    />
  </button>
</template>
