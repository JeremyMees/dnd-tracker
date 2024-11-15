<script setup lang="ts">
const open5e = useOpen5e()
const { t } = useI18n()

const sortBy = ref<Open5eSortBy>('name')
const type = ref<Open5eType>('spells')
const page = ref<number>(0)
const limit = ref<number>(20)
const search = ref<string>('')
const cr = ref<string>()

const { data: hits, status, refresh } = await useAsyncData(
  'campaigns',
  async () => await open5e.fetch(
    type.value,
    {
      limit: limit.value,
      page: page.value,
      ...(search.value && { search: search.value }),
      ...(cr.value && { cr: cr.value }),
      ...(sortBy.value && { ordering: sortBy.value }),
    },
  ), {
    watch: [page, limit, sortBy, cr],
  },
)

watchDebounced([search, type], (newValue, oldValue) => {
  const [newSearch, newType] = newValue
  const [oldSearch, oldType] = oldValue

  if (newSearch !== oldSearch) page.value = 0

  if (newType !== oldType) {
    sortBy.value = 'name'
    page.value = 0
  }

  refresh()
},
{ debounce: 500, maxWait: 1000 },
)

function paginate(newPage: number): void {
  page.value = newPage
  scrollToId('el')
}
</script>

<template>
  <div class="flex flex-col py-6 gap-10 max-h-full">
    <Card
      color="background"
      class="flex items-start gap-4 max-w-prose w-full mx-auto"
    >
      <FormKit
        v-model="search"
        type="search"
        :label="t('components.inputs.nameLabel')"
        outer-class="$reset !pb-0 grow"
      />
      <FormKit
        v-model="type"
        type="select"
        :label="t('components.inputs.typeLabel')"
        :options="open5e.options"
        outer-class="$reset !pb-0 grow"
        @input="search = ''"
      />
    </Card>
    <MasonryGrid
      v-if="status === 'pending'"
      v-slot="{ column }"
      :data="Array.from({ length: 30 }, () => ({}))"
    >
      <SkeletonInfoCard
        v-for="(_item, i) in column"
        :key="i"
      />
    </MasonryGrid>
    <MasonryGrid
      v-else-if="hits?.length"
      v-slot="{ column }"
      :data="hits"
    >
      <InfoCard
        v-for="(hit, j) in column"
        :id="j === 0 ? 'el' : ''"
        :key="hit.slug"
        :type="type"
        :hit="hit"
      />
    </MasonryGrid>
    <Pagination
      v-if="open5e.pages > 1 && status !== 'pending' && hits?.length"
      v-model:page="page"
      :total-pages="open5e.pages"
      class="mt-2"
      @paginate="paginate"
    />
    <p
      v-if="status !== 'pending' && !hits?.length && search !== ''"
      class="text-center max-w-prose mx-auto"
    >
      {{ t('components.fullScreenSearch.notFound') }}
    </p>
  </div>
</template>
