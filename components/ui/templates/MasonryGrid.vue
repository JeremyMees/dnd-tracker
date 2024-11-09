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

const isSmall = useMediaQuery('(max-width: 768px)')
const isLarge = useMediaQuery('(min-width: 1440px)')

const columnCount = computed<number>(() => {
  if (props.maxColumns === 1) return 3
  if (props.maxColumns === 2) return isSmall.value ? 1 : 2
  else return isSmall.value ? 1 : isLarge.value ? 3 : 2
})

const columns = computed<any[][]>(() => splitArray(props.data, columnCount.value))
</script>

<template>
  <component
    :is="element"
    :class="wrapperStyle"
    :style="{
      gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
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
