<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useToast } from '~/components/ui/toast/use-toast'
import { crOptions } from '~~/constants/dnd-rules'
import { useOpen5eListing } from '~~/queries/open5e'

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { toast } = useToast()
const { t } = useI18n()

const limit = 20
const sortBy = ref<Open5eSortBy>('name')
const cr = ref<number | string>('all')
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })

const queryFilters = ref<Open5eFilters>({
  page: 0,
  search: debouncedSearch.value,
  cr: typeof cr.value === 'string' ? undefined : cr.value,
  ordering: sortBy.value,
})

watch([debouncedSearch, cr, sortBy], () => {
  queryFilters.value = {
    page: 0,
    search: debouncedSearch.value,
    cr: typeof cr.value === 'string' ? undefined : cr.value,
    ordering: sortBy.value,
  }
})

const { data, status } = useOpen5eListing(computed(() => ({
  type: 'monsters',
  filters: queryFilters.value,
})))

async function addMonster(monster: Open5eItem): Promise<void> {
  if (!sheet.value) return

  const rows = [
    ...sheet.value.rows,
    createInitiativeRow(monster, 'monster', sheet.value.rows.length),
  ]

  const sortedRows = indexCorrect(rows)

  await update({ rows: sortedRows })

  toast({
    title: t('components.initiativeTable.bestiary.added', { name: monster.name }),
    description: t('components.initiativeTable.bestiary.addedDescription'),
    variant: 'success',
  })
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
      <div class="space-y-2 w-full sm:w-auto sm:flex-1">
        <UiLabel for="search">
          {{ $t('actions.search') }}
        </UiLabel>
        <UiInputGroup>
          <UiInputGroupInput
            id="search"
            v-model="search"
            name="search"
            type="search"
            :disabled="status === 'pending'"
          />
          <UiInputGroupAddon align="inline-end">
            <Icon
              name="tabler:search"
              class="size-3"
              :aria-hidden="true"
            />
          </UiInputGroupAddon>
        </UiInputGroup>
      </div>
      <div class="space-y-2 w-full sm:w-auto sm:flex-1">
        <UiLabel for="cr">
          {{ $t('components.inputs.challengeLabel') }}
        </UiLabel>
        <UiSelect
          id="cr"
          v-model="cr"
          name="cr"
        >
          <UiSelectTrigger>
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [{ label: $t('general.all'), value: 'all' }, ...crOptions]"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </div>
      <div class="space-y-2 w-full sm:w-auto sm:flex-1">
        <UiLabel for="sortBy">
          {{ $t('components.addInitiativeMonster.sort.title') }}
        </UiLabel>
        <UiSelect
          id="sortBy"
          v-model="sortBy"
          name="sortBy"
          :disabled="status === 'pending'"
        >
          <UiSelectTrigger>
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [
                  { label: $t('components.addInitiativeMonster.sort.options.alphabet'), value: 'name' },
                  { label: $t('components.addInitiativeMonster.sort.options.mostHP'), value: '-hit_points' },
                  { label: $t('components.addInitiativeMonster.sort.options.leastHP'), value: 'hit_points' },
                  { label: $t('components.addInitiativeMonster.sort.options.mostAC'), value: '-armor_class' },
                  { label: $t('components.addInitiativeMonster.sort.options.leastAC'), value: 'armor_class' },
                  { label: $t('components.addInitiativeMonster.sort.options.mostCR'), value: '-cr' },
                  { label: $t('components.addInitiativeMonster.sort.options.leastCR'), value: 'cr' },
                ]"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <div class="overflow-y-auto">
      <MasonryGrid
        v-if="status === 'pending'"
        v-slot="{ column }"
        :data="Array.from({ length: 30 }, () => ({}))"
      >
        <SkeletonMonsterCard
          v-for="(_item, i) in column"
          :key="i"
        />
      </MasonryGrid>
      <MasonryGrid
        v-else-if="data?.items?.length"
        v-slot="{ column }"
        :data="data?.items || []"
      >
        <MonsterCard
          v-for="(hit, j) in column"
          :id="j === 0 ? 'el' : ''"
          :key="hit.slug"
          :monster="hit"
          addable
          @add="addMonster"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="data?.pages && data.pages > 1 && status !== 'pending' && data?.items?.length"
      v-model:page="queryFilters.page"
      :pages="data.pages"
      :per-page="limit"
      styles="bg-background/50 border-4 border-background px-4 py-2 rounded-lg"
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
