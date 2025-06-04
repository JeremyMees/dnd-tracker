<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    data: any[]
    element?: 'div' | 'ul' | 'ol'
    wrapperStyle?: string
    columnStyle?: string
    maxColumns?: number
  }>(), {
    element: 'div',
    wrapperStyle: 'grid gap-4 overflow-y-auto',
    columnStyle: 'flex flex-col gap-4',
    maxColumns: 3,
  },
)

const isSmall = useMediaQuery('(max-width: 768px)', { ssrWidth: 1024 })
const isLarge = useMediaQuery('(min-width: 1440px)', { ssrWidth: 1024 })

const columnCount = computed<number>(() => {
  if (isSmall.value) return 1
  if (isLarge.value) return Math.min(3, props.maxColumns)
  return Math.min(2, props.maxColumns)
})

const columns = computed<any[][]>(() => splitArray(props.data, columnCount.value))
</script>

<template>
  <component
    :is="element"
    :class="wrapperStyle"
    :style="{
      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    }"
  >
    <div
      v-for="(column, i) in columns"
      :key="i"
      :class="columnStyle"
    >
      <slot :column="column" />
    </div>
  </component>
</template>
