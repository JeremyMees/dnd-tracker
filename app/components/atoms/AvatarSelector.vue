<script setup lang="ts">
const emit = defineEmits<{ update: [string] }>()

const props = defineProps<{
  identifier: string
  options: string[]
  selected?: string | number
}>()

const current = computed<number>(() => {
  return props.selected
    ? props.options.findIndex((option: string) => option === props.selected)
    : 0
})

const icon = computed<string>(() => {
  switch (props.identifier) {
    case 'backgroundColor': return 'tabler:background'
    case 'accessories': return 'tabler:eyeglass-2'
    case 'clothingColor': return 'tabler:shirt'
    case 'face': return 'tabler:lego'
    case 'facialHair': return 'tabler:moustache'
    case 'head': return 'tabler:mood-boy'
    default: return 'tabler:palette'
  }
})

function prev(): void {
  const index = current.value === 0 ? props.options.length - 1 : current.value - 1
  const option = props.options[index]

  if (option) emit('update', option)
}

function next(): void {
  const index = current.value === props.options.length - 1 ? 0 : current.value + 1
  const option = props.options[index]

  if (option) emit('update', option)
}
</script>

<template>
  <div class="text-foreground flex items-center justify-between gap-2 px-2 border-4 rounded-lg bg-secondary border-secondary min-w-[160px] overflow-hidden">
    <Icon
      v-tippy="$t(`general.${identifier === 'head' ? 'hair' : identifier}`)"
      data-test-icon
      :name="icon"
      class="min-w-6 min-h-6"
      aria-hidden="true"
    />
    <span
      data-test-current
      class="w-8 text-xs text-muted-foreground"
    >
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
