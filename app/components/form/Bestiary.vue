<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useToast } from '~/components/ui/toast/use-toast'
import { crOptions } from '~~/constants/dnd'
import { useOpen5eDocuments, useOpen5eMonsterListing } from '~~/queries/open5e'

const props = withDefaults(defineProps<{
  system?: Open5eGameSystem
  preSelectedDocuments?: string[]
}>(), {
  system: '5e-2024',
  preSelectedDocuments: () => ['srd-2024'],
})

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { toast } = useToast()
const { t } = useI18n()

const limit = 20
const sortBy = ref<Open5eSortBy>('name')
const cr = ref<number | string>('all')
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const selectedSystem = ref<Open5eGameSystem>(props.system)
const selectedDocuments = ref<string[]>(props.preSelectedDocuments)

const queryFilters = ref<Open5eFilters>({
  page: 0,
  name__icontains: debouncedSearch.value,
  cr: typeof cr.value === 'string' ? undefined : cr.value,
  ordering: sortBy.value,
  document__key__in: selectedDocuments.value.join(','),
})

watch([debouncedSearch, cr, sortBy], () => {
  queryFilters.value = {
    page: 0,
    name__icontains: debouncedSearch.value,
    cr: typeof cr.value === 'string' ? undefined : cr.value,
    ordering: sortBy.value,
    document__key__in: selectedDocuments.value.join(','),
  }
})

watch(selectedDocuments, () => {
  queryFilters.value = {
    page: 0,
    name__icontains: '',
    cr: typeof cr.value === 'string' ? undefined : cr.value,
    ordering: sortBy.value,
    document__key__in: selectedDocuments.value.join(','),
  }
})

const { data, status: monstersStatus } = useOpen5eMonsterListing(computed(() => ({
  filters: queryFilters.value,
})))

const { data: documents, status: documentsStatus } = useOpen5eDocuments()

const isLoading = computed(() => monstersStatus.value === 'pending' || documentsStatus.value === 'pending')
const isError = computed(() => monstersStatus.value === 'error' || documentsStatus.value === 'error')

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
          :disabled="isLoading"
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
          :disabled="isLoading"
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
                  { label: $t('components.addInitiativeMonster.sort.options.mostCR'), value: '-challenge_rating' },
                  { label: $t('components.addInitiativeMonster.sort.options.leastCR'), value: 'challenge_rating' },
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
      <div class="space-y-2 w-full sm:w-auto sm:flex-1">
        <UiLabel for="system">
          {{ $t('components.inputs.gameSystemLabel') }}
        </UiLabel>
        <GameSystemFilter
          id="system"
          v-model:document="selectedDocuments"
          v-model:system="selectedSystem"
          :documents="documents || []"
          :disabled="isLoading"
        />
      </div>
    </div>

    <div class="overflow-y-auto">
      <MasonryGrid
        v-if="isLoading"
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
          :key="hit.id"
          :monster="hit"
          addable
          @add="addMonster"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="data?.pages && data.pages > 1 && !isLoading && data?.items?.length"
      v-model:page="queryFilters.page"
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
      v-if="!isLoading && !data?.items?.length && search !== ''"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.notFound') }}
    </p>
  </div>
</template>
