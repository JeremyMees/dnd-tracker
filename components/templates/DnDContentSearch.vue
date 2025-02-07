<script setup lang="ts">
const sortBy = ref<Open5eSortBy>('name')
const type = ref<Open5eType>('spells')
const page = ref<number>(0)
const limit = ref<number>(20)
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const cr = ref<string>()

const { data, status } = useOpen5eListing(computed(() => ({
  type: type.value,
  filters: {
    page: page.value,
    ...(debouncedSearch.value && { search: debouncedSearch.value }),
    ...(cr.value && { cr: cr.value }),
    ...(sortBy.value && { ordering: sortBy.value }),
  },
})))

watch(search, () => page.value = 0)

watch(type, () => {
  search.value = ''
  page.value = 0
  sortBy.value = 'name'
})
</script>

<template>
  <div class="flex flex-col gap-4 max-h-full">
    <Card
      color="secondary"
      class="flex flex-wrap items-center gap-4 w-full dnd-container"
    >
      <FormKit
        v-model="search"
        type="search"
        :label="$t('components.inputs.nameLabel')"
        outer-class="$reset !pb-0 flex-1"
      />
      <FormKit
        v-model="type"
        type="select"
        :label="$t('components.inputs.typeLabel')"
        :options="[
          { value: 'spells', label: $t('general.spell', 2) },
          { value: 'conditions', label: $t('general.condition', 2) },
          { value: 'magicitems', label: $t('general.magicItem', 2) },
          { value: 'weapons', label: $t('general.weapon', 2) },
          { value: 'armor', label: $t('general.armor') },
          { value: 'sections', label: $t('general.section', 2) },
        ]"
        outer-class="$reset !pb-0 flex-1"
        @input="search = ''"
      />
    </Card>

    <MasonryGrid
      v-if="status === 'pending'"
      v-slot="{ column }"
      :data="Array.from({ length: 30 }, () => ({}))"
    >
      <SkeletonContentCard
        v-for="(_item, i) in column"
        :key="i"
      />
    </MasonryGrid>
    <MasonryGrid
      v-else-if="data?.items?.length"
      v-slot="{ column }"
      :data="data.items"
    >
      <ContentCard
        v-for="(hit, j) in column"
        :id="j === 0 ? 'el' : ''"
        :key="hit.slug"
        :type="type"
        :hit="hit"
      />
    </MasonryGrid>

    <Pagination
      v-if="data?.pages > 1 && status !== 'pending' && data?.items?.length"
      v-model:page="page"
      :pages="data.pages"
      :per-page="limit"
      styled
      class="mx-auto"
      @paginate="scrollToId('el')"
    />
    <p
      v-if="status === 'error'"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.error') }}
    </p>
    <p
      v-if="status !== 'pending' && !data?.items?.length && search !== ''"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.notFound') }}
    </p>
  </div>
</template>
