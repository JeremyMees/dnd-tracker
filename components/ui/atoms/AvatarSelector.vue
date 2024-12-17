<script setup lang="ts">
const emit = defineEmits<{ update: [string] }>()

const props = defineProps<{
  identifier: string
  options: string[]
  selected?: string | number
}>()

const { t } = useI18n()

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
  const index = current.value === 0
    ? props.options.length - 1
    : current.value - 1

  emit('update', props.options[index])
}

function next(): void {
  const index = current.value === props.options.length - 1
    ? 0
    : current.value + 1

  emit('update', props.options[index])
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 px-2 btn-small-black min-w-[160px] overflow-hidden">
    <button
      :aria-label="t('actions.prev')"
      class="min-w-7 min-h-7 flex items-center justify-center focus:outline-primary"
      @click="prev"
    >
      <Icon
        class="min-w-6 min-h-6"
        name="tabler:chevron-left"
        aria-hidden="true"
      />
    </button>
    <Icon
      v-tippy="t(`general.${identifier === 'head' ? 'hair' : identifier}`)"
      :name="icon"
      class="min-w-6 min-h-6"
      aria-hidden="true"
    />
    <span class="w-10">
      {{ current + 1 }}/{{ options.length }}
    </span>
    <button
      :aria-label="t('actions.next')"
      class="min-w-7 min-h-7 flex items-center justify-center focus:outline-primary"
      @click="next"
    >
      <Icon
        class="min-w-6 min-h-6"
        name="tabler:chevron-right"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
