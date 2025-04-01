<script setup lang="ts">
defineEmits<{ paginate: [value: number] }>()

withDefaults(
  defineProps<{
    pages: number
    perPage?: number
    styles?: string
    loading?: boolean
  }>(), {
    perPage: 10,
    styles: '',
    loading: false,
  },
)

const page = defineModel<number>('page', { required: true })

// Convert 0-based to 1-based for Radix
const internalPage = computed({
  get: () => page.value + 1,
  set: (value: number) => page.value = value - 1,
})
</script>

<template>
  <UiPagination
    v-model:page="internalPage"
    :total="Math.max(1, (pages * perPage) - 2)"
    :items-per-page="perPage"
    :disabled="loading"
    @update:page="$emit('paginate', $event - 1)"
  >
    <UiPaginationList
      :class="styles"
      class="flex items-center gap-6 w-fit"
    >
      <div class="text-sm text-foreground">
        {{ $t('components.pagination.page', { page: internalPage, pages }) }}
      </div>
      <div class="flex items-center gap-2">
        <UiPaginationFirst />
        <UiPaginationPrev />
        <UiPaginationNext />
        <UiPaginationLast />
      </div>
    </UiPaginationList>
  </UiPagination>
</template>
