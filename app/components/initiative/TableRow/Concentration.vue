<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { patchRow } = validateInject(INITIATIVE_SHEET)

function updateConcentration(used: number): void {
  patchRow(props.item.id, { concentration: used > 0 })
}
</script>

<template>
  <Tooltip v-if="item.type !== 'lair'" :text="$t('general.concentration')">
    <UsePips
      test-id="concentration"
      class="justify-center"
      :label="$t('general.concentration')"
      :max="1"
      :used="item.concentration ? 1 : 0"
      @update:used="updateConcentration"
    />
  </Tooltip>
</template>
