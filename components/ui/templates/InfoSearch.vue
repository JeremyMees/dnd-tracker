<script setup lang="ts">
const open5e = useOpen5e()
const { t } = useI18n()

onBeforeMount(() => open5e.reset('spells'))
</script>

<template>
  <div class="flex flex-col py-6 gap-10 max-h-full">
    <Card
      color="background"
      class="flex items-start gap-4 max-w-prose w-full mx-auto"
    >
      <FormKit
        v-model="open5e.search"
        type="search"
        :label="t('components.inputs.nameLabel')"
        outer-class="$reset !pb-0 grow"
      />
      <FormKit
        v-model="open5e.type"
        type="select"
        :label="t('components.inputs.typeLabel')"
        :options="open5e.options"
        outer-class="$reset !pb-0 grow"
        @input="open5e.search = ''"
      />
    </Card>
    <MasonryGrid
      v-if="open5e.isLoading"
      v-slot="{ column }"
      :data="Array.from({ length: 30 }, () => ({}))"
    >
      <SkeletonInfoCard
        v-for="(_item, i) in column"
        :key="i"
      />
    </MasonryGrid>
    <MasonryGrid
      v-else-if="open5e.hits.length"
      v-slot="{ column }"
      :data="open5e.hits"
    >
      <InfoCard
        v-for="(hit, j) in column"
        :id="j === 0 ? 'el' : ''"
        :key="hit.slug"
        :type="open5e.type"
        :hit="hit"
      />
    </MasonryGrid>
    <Pagination
      v-if="open5e.pages > 1 && !open5e.isLoading && open5e.hits.length"
      v-model:page="open5e.page"
      :total-pages="open5e.pages"
      class="mt-2"
      @paginate="open5e.paginate"
    />
    <p
      v-if="!open5e.isLoading && !open5e.hits.length && open5e.search !== ''"
      class="text-center max-w-prose mx-auto"
    >
      {{ t('components.fullScreenSearch.notFound') }}
    </p>
  </div>
</template>
