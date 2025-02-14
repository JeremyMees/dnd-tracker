<script setup lang="ts">
defineEmits<{ openInfo: [] }>()

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

const currentRowIndex = computed<number>(() => getCurrentRowIndex(props.sheet, props.item.id))

const canGoUp = computed(() => {
  return currentRowIndex.value > 0
    && props.sheet.rows[currentRowIndex.value - 1]?.initiative === props.item.initiative
})

const canGoDown = computed(() => {
  return currentRowIndex.value < props.sheet.rows.length - 1
    && props.sheet.rows[currentRowIndex.value + 1]?.initiative === props.item.initiative
})

async function moveRow(up: boolean): Promise<void> {
  const index = currentRowIndex.value
  const rows = [...props.sheet.rows]

  // Validate indexes are within bounds
  if (up && index <= 0) return
  if (!up && index >= rows.length - 1) return

  const targetIndex = up ? index - 1 : index + 1

  // Swap indexes between current and target rows
  const currentIndex = rows[index].index

  rows[index] = {
    ...rows[index],
    index: rows[targetIndex].index,
  }

  rows[targetIndex] = {
    ...rows[targetIndex],
    index: currentIndex,
  }

  // When moving up, update all following indexes to maintain sequence
  if (up) {
    for (let i = index + 1; i < rows.length; i++) {
      rows[i].index = i
    }
  }

  await props.update({
    rows: rows.sort((a, b) => a.index - b.index),
  })
}
</script>

<template>
  <td>
    <div class="flex gap-2 items-center text-left">
      <button @click="$emit('openInfo')">
        <Icon
          v-if="item.initiative < 0"
          name="tabler:plus"
          class="size-5 min-w-5 text-secondary"
          aria-hidden="true"
        />
        <span v-else>{{ item.initiative }}</span>
      </button>
      <div
        v-if="item.initiative !== null && item.initiative >= 0"
        class="flex flex-col"
      >
        <button
          v-if="canGoUp"
          v-tippy="$t('actions.moveUp')"
          :aria-label="$t('actions.moveUp')"
          :class="{ 'relative top-1': canGoDown }"
          class="flex items-center"
          @click="moveRow(true)"
        >
          <Icon
            name="tabler:caret-up"
            class="size-5 min-w-5 text-tertiary"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="canGoDown"
          v-tippy="$t('actions.moveDown')"
          :aria-label="$t('actions.moveDown')"
          :class="{ 'relative bottom-1': canGoUp }"
          class="flex items-center"
          @click="moveRow(false)"
        >
          <Icon
            name="tabler:caret-down"
            class="size-5 min-w-5 text-tertiary"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </td>
</template>
