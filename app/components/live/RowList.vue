<script setup lang="ts">
const props = defineProps<{
  sheet?: PlayerSheet
  loading: boolean
}>()

const activeId = computed(() => {
  if (!props.sheet) return undefined

  return props.sheet.rows[props.sheet.activeIndex]?.id
})

const { listRef, setRowRef } = useLiveRowScroll(activeId)
</script>

<template>
  <div
    ref="listRef"
    test-id="list"
    class="flex-1 min-h-0 overflow-y-auto dnd-container py-4"
  >
    <div class="flex flex-col gap-3">
      <template v-if="sheet">
        <LiveRowCard
          v-for="(row, index) in sheet.rows"
          :key="row.id"
          :ref="el => setRowRef(row.id, el)"
          :row="row"
          :active="index === sheet.activeIndex"
        />
      </template>

      <template v-else-if="loading">
        <SkeletonLiveRowCard v-for="i in 4" :key="i" test-id="loading" />
      </template>
    </div>
  </div>
</template>
