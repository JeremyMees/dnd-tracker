<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useToast } from '~/components/ui/toast/use-toast'
import { crOptions, gameSystems } from '~~/constants/dnd'
import { useOpen5eDocuments, useOpen5eMonsterListing } from '~/queries/open5e'

const props = withDefaults(
  defineProps<{
    system?: Open5eGameSystem
    preSelectedDocuments?: string[]
    persist?: FilterPersistence
  }>(),
  {
    system: '5e-2024',
    preSelectedDocuments: () => ['srd-2024'],
    persist: 'none',
  },
)

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { toast } = useToast()
const { t } = useI18n()

const limit = 20

const crFilterOptions = computed<{ label: string; value: number | string }[]>(
  () => [{ label: t('general.all'), value: 'all' }, ...crOptions],
)

const sortOptions = computed<{ label: string; value: Open5eSortBy }[]>(() => [
  {
    label: t('components.addInitiativeMonster.sort.options.alphabet'),
    value: 'name',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.mostHP'),
    value: '-hit_points',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.leastHP'),
    value: 'hit_points',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.mostAC'),
    value: '-armor_class',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.leastAC'),
    value: 'armor_class',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.mostCR'),
    value: '-challenge_rating',
  },
  {
    label: t('components.addInitiativeMonster.sort.options.leastCR'),
    value: 'challenge_rating',
  },
])

const { state } = useFilterState(
  'bestiary',
  {
    search: '',
    cr: 'all' as number | string,
    sortBy: 'name' as Open5eSortBy,
    system: props.system,
    documents: props.preSelectedDocuments,
    page: 0,
  },
  {
    persist: props.persist,
    codecs: {
      cr: oneOfFilterCodec(crFilterOptions.value.map(option => option.value)),
      sortBy: oneOfFilterCodec(sortOptions.value.map(option => option.value)),
      system: oneOfFilterCodec(gameSystems),
    },
  },
)

const appliedSearch = ref<string>(state.search)

watchDebounced(
  () => state.search,
  value => (appliedSearch.value = value),
  { debounce: 500, maxWait: 1000 },
)

watch(
  [() => state.cr, () => state.sortBy, () => state.documents, appliedSearch],
  () => {
    state.page = 0
  },
)

const queryFilters = computed<Open5eFilters>(() => ({
  page: state.page,
  name__icontains: appliedSearch.value,
  cr: typeof state.cr === 'string' ? undefined : state.cr,
  ordering: state.sortBy,
  document__key__in: state.documents.join(','),
}))

const { data, status: monstersStatus } = useOpen5eMonsterListing(
  computed(() => ({
    filters: queryFilters.value,
  })),
)

const { data: documents, status: documentsStatus } = useOpen5eDocuments()

const isLoading = computed(
  () =>
    monstersStatus.value === 'pending' || documentsStatus.value === 'pending',
)
const isError = computed(
  () => monstersStatus.value === 'error' || documentsStatus.value === 'error',
)

const showResetButton = computed<boolean>(() => {
  return (
    state.search !== '' ||
    state.cr !== 'all' ||
    state.sortBy !== 'name' ||
    state.system !== props.system ||
    !isEqualArray(state.documents, props.preSelectedDocuments)
  )
})

function resetFilters(): void {
  state.search = ''
  state.cr = 'all'
  state.sortBy = 'name'
  state.system = props.system
  state.documents = props.preSelectedDocuments
  appliedSearch.value = ''
}

async function addMonster(monster: DndMonster): Promise<void> {
  if (!sheet.value) return

  const {
    initiativeBonus,
    hitDice,
    languages,
    type: _type,
    size: _size,
    challengeRating: _challengeRating,
    alignment: _alignment,
    experiencePoints: _experiencePoints,
    ...rest
  } = monster

  const rows = [
    ...sheet.value.rows,
    createInitiativeRow(
      {
        ...rest,
        hitDice: parseDndDiceToString(hitDice),
        languages: parseDndLanguages(languages),
        initiativeModifier: initiativeBonus,
      },
      'monster',
      sheet.value.rows.length,
    ),
  ]

  const sortedRows = indexCorrect(rows)

  await update({ rows: sortedRows })

  toast({
    title: t('components.initiativeTable.bestiary.added', {
      name: monster.name,
    }),
    description: t('components.initiativeTable.bestiary.addedDescription'),
    variant: 'success',
  })
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row items-end gap-x-4 gap-y-2">
        <div class="space-y-2 w-full sm:w-auto sm:flex-1">
          <UiLabel for="search">
            {{ $t('actions.search') }}
          </UiLabel>
          <UiInputGroup>
            <UiInputGroupInput
              id="search"
              v-model="state.search"
              name="search"
              type="search"
            />
            <UiInputGroupAddon align="inline-end">
              <Icon name="tabler:search" class="size-3" :aria-hidden="true" />
            </UiInputGroupAddon>
          </UiInputGroup>
        </div>
        <div class="space-y-2 w-full sm:w-auto sm:flex-1">
          <UiLabel for="cr">
            {{ $t('components.inputs.challengeLabel') }}
          </UiLabel>
          <UiSelect id="cr" v-model="state.cr" name="cr" :disabled="isLoading">
            <UiSelectTrigger>
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in crFilterOptions"
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
            v-model="state.sortBy"
            name="sortBy"
            :disabled="isLoading"
          >
            <UiSelectTrigger>
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in sortOptions"
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
          <UiLabel for="system">
            {{ $t('components.inputs.gameSystemLabel') }}
          </UiLabel>
          <GameSystemFilter
            id="system"
            v-model:document="state.documents"
            v-model:system="state.system"
            :documents="documents || []"
            :disabled="isLoading"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <AnimationExpand axis="width">
          <UiButton
            v-if="showResetButton"
            test-id="reset-filters"
            variant="foreground-ghost"
            @click="resetFilters"
          >
            <Icon name="tabler:filter-x" />
            {{ $t('actions.resetFilter', 2) }}
          </UiButton>
        </AnimationExpand>
      </div>
    </div>

    <div class="overflow-y-auto">
      <MasonryGrid
        v-if="isLoading"
        v-slot="{ column }"
        :data="Array.from({ length: 30 }, () => ({}))"
      >
        <SkeletonMonsterCard v-for="(_item, i) in column" :key="i" />
      </MasonryGrid>
      <MasonryGrid
        v-else-if="data?.items?.length"
        v-slot="{ column }"
        :data="data?.items || []"
      >
        <MonsterCard
          v-for="(hit, j) in column"
          :id="j === 0 ? 'el' : ''"
          :key="hit.id"
          :monster="hit"
          addable
          @add="addMonster"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="data?.pages && data.pages > 1 && !isLoading && data?.items?.length"
      v-model:page="state.page"
      :pages="data.pages"
      :per-page="limit"
      styles="bg-background/50 border-4 border-background px-4 py-2 rounded-lg"
      class="mx-auto"
      @paginate="scrollToId('el')"
    />
    <p
      v-if="isError"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.error') }}
    </p>
    <p
      v-if="!isLoading && !data?.items?.length && state.search !== ''"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.notFound') }}
    </p>
  </div>
</template>
