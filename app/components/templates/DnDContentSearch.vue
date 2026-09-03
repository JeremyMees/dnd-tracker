<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useOpen5eListing, useOpen5eDocuments } from '~/queries/open5e'
import { gameSystems } from '~~/constants/dnd'

const props = withDefaults(
  defineProps<{
    variant?: 'secondary' | 'background'
    sheet?: InitiativeSheet
    update?: (
      payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>,
    ) => Promise<void>
    allowPin?: boolean
    system?: Open5eGameSystem
    preSelectedDocuments?: string[]
    persist?: FilterPersistence
  }>(),
  {
    variant: 'secondary',
    allowPin: false,
    system: '5e-2024',
    preSelectedDocuments: () => ['srd-2024'],
    class: '',
    sheet: undefined,
    update: undefined,
    persist: 'none',
  },
)

const { toast } = useToast()
const { t } = useI18n()

const showPinned = ref<boolean>(false)
const limit = 20

const typeOptions = computed<{ value: Open5eType; label: string }[]>(() => [
  { value: 'spells', label: t('general.spell', 2) },
  { value: 'conditions', label: t('general.condition', 2) },
  { value: 'magicitems', label: t('general.magicItem', 2) },
  { value: 'weapons', label: t('general.weapon', 2) },
  { value: 'armor', label: t('general.armor') },
])

const { state } = useFilterState(
  'dnd-content-search',
  {
    search: '',
    type: 'spells' as Open5eType,
    system: props.system,
    documents: props.preSelectedDocuments,
    page: 0,
  },
  {
    persist: props.persist,
    codecs: {
      type: oneOfFilterCodec(typeOptions.value.map(option => option.value)),
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

watch([() => state.type, () => state.documents, appliedSearch], () => {
  state.page = 0
})

const queryFilters = computed<Open5eFilters>(() => ({
  page: state.page,
  name__icontains: appliedSearch.value,
  ordering: 'name',
  document__key__in: state.documents.join(','),
}))

function handleTypeChange(): void {
  state.search = ''
  appliedSearch.value = ''
}

const { data, status: listingStatus } = useOpen5eListing(
  computed(() => ({
    type: state.type,
    filters: queryFilters.value,
  })),
)

const { data: documents, status: documentsStatus } = useOpen5eDocuments()

const isLoading = computed(
  () =>
    listingStatus.value === 'pending' || documentsStatus.value === 'pending',
)
const isError = computed(
  () => listingStatus.value === 'error' || documentsStatus.value === 'error',
)

async function handlePinToggle(
  content: DndItem,
  remove: boolean,
): Promise<void> {
  if (!props.sheet || !props.update) return

  let cards = [...props.sheet.infoCards]

  if (remove) cards = cards.filter(i => i.id !== content.id)
  else if (cards.length >= 10) {
    toast({
      title: t('components.dndContentSearch.toast.maxTitle'),
      description: t('components.dndContentSearch.toast.maxText'),
      variant: 'destructive',
    })
  } else cards.push(content)

  await props.update({ infoCards: cards })
}

async function removePins(): Promise<void> {
  if (!props.sheet || !props.update) return

  await props.update({ infoCards: [] })

  showPinned.value = false
}

const showResetButton = computed<boolean>(() => {
  return (
    state.search !== '' ||
    state.type !== 'spells' ||
    state.system !== props.system ||
    !isEqualArray(state.documents, props.preSelectedDocuments)
  )
})

function resetFilters(): void {
  state.search = ''
  state.type = 'spells'
  state.system = props.system
  state.documents = props.preSelectedDocuments
  appliedSearch.value = ''
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row items-end gap-x-4 gap-y-2">
        <div class="space-y-2 w-full sm:w-auto sm:flex-1">
          <UiLabel for="search">
            {{ $t('components.inputs.nameLabel') }}
          </UiLabel>
          <UiInputGroup>
            <UiInputGroupInput
              id="search"
              v-model="state.search"
              test-id="search"
              :disabled="showPinned"
              name="search"
              type="search"
            />
            <UiInputGroupAddon align="inline-end">
              <Icon name="tabler:search" class="size-3" :aria-hidden="true" />
            </UiInputGroupAddon>
          </UiInputGroup>
        </div>
        <div class="space-y-2 w-full sm:w-auto sm:flex-1">
          <UiLabel for="type">
            {{ $t('components.inputs.typeLabel') }}
          </UiLabel>
          <UiSelect
            id="type"
            v-model="state.type"
            name="type"
            :disabled="showPinned || isLoading"
            @update:model-value="handleTypeChange"
          >
            <UiSelectTrigger test-id="type">
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in typeOptions"
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
            :disabled="showPinned || isLoading"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <AnimationReveal>
          <div v-if="sheet?.infoCards?.length" class="flex gap-2">
            <UiButton
              test-id="pin-toggle"
              :aria-label="
                $t(
                  `components.dndContentSearch.${showPinned ? 'hide' : 'show'}`,
                )
              "
              variant="foreground-ghost"
              @click="showPinned = !showPinned"
            >
              <Icon name="tabler:pin" />
              {{
                $t(
                  `components.dndContentSearch.${showPinned ? 'hide' : 'show'}`,
                )
              }}
            </UiButton>
            <UiButton
              test-id="remove-pins"
              :aria-label="$t('components.dndContentSearch.remove')"
              variant="destructive-ghost"
              @click="removePins"
            >
              <Icon name="tabler:trash" />
              {{ $t('components.dndContentSearch.remove') }}
            </UiButton>
          </div>
        </AnimationReveal>
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
        test-id="loading"
        :data="Array.from({ length: 30 }, () => ({}))"
      >
        <SkeletonContentCard
          v-for="(_item, i) in column"
          :key="i"
          :variant="variant"
        />
      </MasonryGrid>
      <MasonryGrid
        v-else-if="
          data?.items?.length || (showPinned && sheet?.infoCards?.length)
        "
        v-slot="{ column }"
        test-id="content-grid"
        :data="
          showPinned && sheet ? (sheet?.infoCards ?? []) : (data?.items ?? [])
        "
      >
        <ContentCard
          v-for="(hit, j) in column"
          :id="j === 0 ? 'el' : ''"
          :key="hit.id"
          :type="state.type"
          :hit="hit"
          :variant="variant"
          :allow-pin="allowPin"
          :pinned="sheet?.infoCards?.some(i => i.id === hit.id) ?? false"
          @pin="handlePinToggle(hit, false)"
          @unpin="handlePinToggle(hit, true)"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="
        data?.pages &&
        data.pages > 1 &&
        !isLoading &&
        data?.items?.length &&
        !showPinned
      "
      v-model:page="state.page"
      test-id="pagination"
      :pages="data.pages"
      :per-page="limit"
      :styles="
        variant === 'secondary'
          ? 'bg-secondary/50 border-4 border-secondary px-4 py-2 rounded-lg'
          : 'bg-background border-4 border-background px-4 py-2 rounded-lg'
      "
      class="mx-auto"
      @paginate="scrollToId('el')"
    />
    <p
      v-if="isError"
      test-id="error"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.error') }}
    </p>
    <p
      v-if="!isLoading && !data?.items?.length && state.search !== ''"
      test-id="not-found"
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.notFound') }}
    </p>
  </div>
</template>
