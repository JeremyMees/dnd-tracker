<script setup lang="ts">
const emit = defineEmits<{ paginate: [value: number] }>()

const props = withDefaults(
  defineProps<{
    totalPages: number
    totalItems: number
    perPage?: number
    loading?: boolean
  }>(), {
    perPage: 20,
    loading: false,
  },
)

const page = defineModel<number>('page', { required: true })
const { t } = useI18n()

const pageString = computed<string>(() => {
  const start = (page.value * props.perPage) + 1
  const end = Math.min((page.value + 1) * props.perPage, props.totalItems)

  return `${start}-${end} ${t('general.of')} ${props.totalItems}`
})

function handleNext(): void {
  handleSelect(Math.min(page.value + 1, props.totalPages))
}

function handlePrevious(): void {
  handleSelect(Math.max(page.value - 1, 0))
}

function handleSelect(v: number): void {
  page.value = v
  emit('paginate', v)
}
</script>

<template>
  <div class="flex justify-center items-center w-fit">
    <span class="pr-6 body-small">
      {{ pageString }}
    </span>
    <button
      class="flex items-center justify-center w-6 h-6"
      :class="{ 'cursor-progress': loading }"
      :disabled="page === 0 || loading"
      :aria-label="t('actions.prev')"
      @click="handlePrevious"
    >
      <Icon
        name="ph:caret-left"
        class="h-6 w-6 transition-opacity"
        :class="{ 'opacity-50': page === 0 }"
        aria-hidden="true"
      />
    </button>
    <button
      class="flex items-center justify-center w-6 h-6"
      :class="{ 'cursor-progress': loading }"
      :disabled="page === totalPages - 1 || loading"
      :aria-label="t('actions.next')"
      @click="handleNext"
    >
      <Icon
        name="ph:caret-right"
        class="h-6 w-6 transition-opacity"
        :class="{ 'opacity-50': page === totalPages - 1 }"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
