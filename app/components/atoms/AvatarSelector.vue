<script setup lang="ts">
const emit = defineEmits<{ update: [string] }>()

const props = defineProps<{
  identifier: string
  options: string[]
  selected?: string | number
}>()

const current = computed<number>(() => {
  return props.selected !== undefined
    ? props.options.findIndex((option: string) => option === props.selected)
    : 0
})

const identifiers: Record<string, { icon: string; label: string }> = {
  accessoriesVariant: { icon: 'tabler:eyeglass-2', label: 'accessories' },
  backgroundColor: { icon: 'tabler:background', label: 'backgroundColor' },
  clothingColor: { icon: 'tabler:shirt', label: 'clothingColor' },
  expressionVariant: { icon: 'tabler:lego', label: 'face' },
  facialHairVariant: { icon: 'tabler:moustache', label: 'facialHair' },
  headVariant: { icon: 'tabler:mood-boy', label: 'hair' },
}

const icon = computed<string>(() => {
  return identifiers[props.identifier]?.icon ?? 'tabler:palette'
})

const label = computed<string>(() => {
  return identifiers[props.identifier]?.label ?? props.identifier
})

function prev(): void {
  const index =
    current.value === 0 ? props.options.length - 1 : current.value - 1
  const option = props.options[index]

  if (option !== undefined) emit('update', option)
}

function next(): void {
  const index =
    current.value === props.options.length - 1 ? 0 : current.value + 1
  const option = props.options[index]

  if (option !== undefined) emit('update', option)
}
</script>

<template>
  <div
    class="text-foreground flex items-center justify-between gap-2 px-2 border-4 rounded-lg bg-secondary border-secondary min-w-[160px] overflow-hidden"
  >
    <Icon
      v-tippy="$t(`general.${label}`)"
      data-test-icon
      :name="icon"
      class="min-w-6 min-h-6"
      aria-hidden="true"
    />
    <span data-test-current class="w-8 text-xs text-muted-foreground">
      {{ current + 1 }}/{{ options.length }}
    </span>
    <div class="flex items-center">
      <button
        data-test-prev
        :aria-label="$t('actions.prev')"
        class="w-5 flex items-center justify-center focus:outline-primary"
        @click="prev"
      >
        <Icon
          class="min-w-6 min-h-6"
          name="tabler:caret-left"
          aria-hidden="true"
        />
      </button>
      <button
        data-test-next
        :aria-label="$t('actions.next')"
        class="w-5 flex items-center justify-center focus:outline-primary"
        @click="next"
      >
        <Icon
          class="min-w-6 min-h-6"
          name="tabler:caret-right"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
