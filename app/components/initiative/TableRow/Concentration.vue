<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

function updateConcentration(): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], concentration: !props.item.concentration }

  update({ rows })
}
</script>

<template>
  <button
    v-if="item.type !== 'lair'"
    v-tippy="$t('general.concentration')"
    :data-test-concentration="item.concentration"
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
