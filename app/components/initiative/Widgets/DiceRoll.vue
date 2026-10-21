<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const { log } = validateInject(INITIATIVE_SHEET)

function onRolled(
  total: number,
  rolled: Partial<Record<DndDice, number[]>>,
): void {
  const dice = Object.entries(rolled)
    .map(([die, numbers]) => `${numbers.length}${die}`)
    .join(', ')

  if (!dice) return

  log?.([{ type: 'roll', rowId: null, payload: { kind: 'dice', total, dice } }])
}
</script>

<template>
  <Card id="tour-2" color="secondary">
    <DiceRoller :styled="false" @rolled="onRolled" />
  </Card>
</template>
