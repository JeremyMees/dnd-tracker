<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useOpen5eListing, useOpen5eDocuments } from '~~/queries/open5e'

const props = withDefaults(defineProps<{
  variant?: 'secondary' | 'background'
  sheet?: InitiativeSheet
  update?: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  allowPin?: boolean
  system?: Open5eGameSystem
  preSelectedDocuments?: string[]
}>(), {
  variant: 'secondary',
  allowPin: false,
  system: '5e-2024',
  preSelectedDocuments: () => ['srd-2024'],
})

const { toast } = useToast()
const { t } = useI18n()

const showPinned = ref<boolean>(false)
const sortBy = ref<Open5eSortBy>('name')
const type = ref<Open5eType>('spells')
const limit = 20
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const selectedSystem = ref<Open5eGameSystem>(props.system)
const selectedDocuments = ref<string[]>(props.preSelectedDocuments)

const queryFilters = ref<Open5eFilters>({
  page: 0,
  search: debouncedSearch.value,
  ordering: sortBy.value,
  document__key__in: selectedDocuments.value,
})

watch([debouncedSearch, sortBy], () => {
  queryFilters.value = {
    page: 0,
    search: debouncedSearch.value,
    ordering: sortBy.value,
    document__key__in: selectedDocuments.value,
  }
})

watch([type, selectedDocuments], () => {
  queryFilters.value = {
    page: 0,
    search: '',
    ordering: 'name',
    document__key__in: selectedDocuments.value,
  }
})

const { data, status: listingStatus } = useOpen5eListing(computed(() => ({
  type: type.value,
  filters: queryFilters.value,
})))

const { data: documents, status: documentsStatus } = useOpen5eDocuments()

const isLoading = computed(() => listingStatus.value === 'pending' || documentsStatus.value === 'pending')
const isError = computed(() => listingStatus.value === 'error' || documentsStatus.value === 'error')

async function handlePinToggle(content: Open5eItem, remove: boolean): Promise<void> {
  if (!props.sheet || !props.update) return

  let cards = [...props.sheet.info_cards]

  if (remove) cards = cards.filter(i => i.slug !== content.slug)
  else if (cards.length >= 10) {
    toast({
      title: t('components.dndContentSearch.toast.maxTitle'),
      description: t('components.dndContentSearch.toast.maxText'),
      variant: 'destructive',
    })
  }
  else cards.push(content)

  await props.update({ info_cards: cards })
}

async function removePins(): Promise<void> {
  if (!props.sheet || !props.update) return

  await props.update({ info_cards: [] })

  showPinned.value = false
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
        <div class="space-y-2 w-full sm:w-auto sm:flex-1">
          <UiLabel for="search">
            {{ $t('components.inputs.nameLabel') }}
          </UiLabel>
          <UiInputGroup>
            <UiInputGroupInput
              id="search"
              v-model="search"
              data-test-search
              :disabled="showPinned || isLoading"
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
          <UiLabel for="type">
            {{ $t('components.inputs.typeLabel') }}
          </UiLabel>
          <UiSelect
            id="type"
            v-model="type"
            name="type"
            :disabled="showPinned || isLoading"
            @update:model-value="search = ''"
          >
            <UiSelectTrigger data-test-type>
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in [
                    { value: 'spells', label: $t('general.spell', 2) },
                    { value: 'conditions', label: $t('general.condition', 2) },
                    { value: 'magicitems', label: $t('general.magicItem', 2) },
                    { value: 'weapons', label: $t('general.weapon', 2) },
                    { value: 'armor', label: $t('general.armor') },
                    { value: 'sections', label: $t('general.section', 2) },
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
            :disabled="showPinned || isLoading"
          />
        </div>
      </div>
      <AnimationReveal>
        <div
          v-if="sheet?.info_cards?.length"
          class="flex gap-2"
        >
          <UiButton
            data-test-pin-toggle
            :aria-label="$t(`components.dndContentSearch.${showPinned ? 'hide' : 'show'}`)"
            variant="foreground-ghost"
            @click="showPinned = !showPinned"
          >
            <Icon name="tabler:pin" />
            {{ $t(`components.dndContentSearch.${showPinned ? 'hide' : 'show'}`) }}
          </UiButton>
          <UiButton
            data-test-remove-pins
            :aria-label="$t('components.dndContentSearch.remove')"
            variant="destructive-ghost"
            @click="removePins"
          >
            <Icon name="tabler:trash" />
            {{ $t('components.dndContentSearch.remove') }}
          </UiButton>
        </div>
      </AnimationReveal>
    </div>

    <div class="overflow-y-auto">
      <MasonryGrid
        v-if="isLoading"
        v-slot="{ column }"
        data-test-loading
        :data="Array.from({ length: 30 }, () => ({}))"
      >
        <SkeletonContentCard
          v-for="(_item, i) in column"
          :key="i"
          :variant="variant"
        />
      </MasonryGrid>
      <MasonryGrid
        v-else-if="data?.items?.length || (showPinned && sheet?.info_cards?.length)"
        v-slot="{ column }"
        data-test-content-grid
        :data="showPinned && sheet ? sheet?.info_cards ?? [] : data?.items ?? []"
      >
        <ContentCard
          v-for="(hit, j) in column"
          :id="j === 0 ? 'el' : ''"
          :key="hit.key"
          :type="type"
          :hit="hit"
          :variant="variant"
          :allow-pin="allowPin"
          :pinned="sheet?.info_cards?.some(i => (i.key === hit.key || i.slug === hit.slug) ? true : false) ?? false"
          @pin="handlePinToggle(hit, false)"
          @unpin="handlePinToggle(hit, true)"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="data?.pages && data.pages > 1 && !isLoading && data?.items?.length && !showPinned"
      v-model:page="queryFilters.page"
      data-test-pagination
      :pages="data.pages"
      :per-page="limit"
      :styles="variant === 'secondary'
        ? 'bg-secondary/50 border-4 border-secondary px-4 py-2 rounded-lg'
        : 'bg-background border-4 border-background px-4 py-2 rounded-lg'
      "
      class="mx-auto"
      @paginate="scrollToId('el')"
    />
    <p
      v-if="isError"
      data-test-error
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.error') }}
    </p>
    <p
      v-if="!isLoading && !data?.items?.length && search !== ''"
      data-test-not-found
      class="text-center max-w-prose mx-auto text-muted-foreground"
    >
      {{ $t('components.dndContentSearch.notFound') }}
    </p>
  </div>
</template>
