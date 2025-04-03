<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const props = withDefaults(defineProps<{
  variant?: 'secondary' | 'background'
  sheet?: InitiativeSheet
  update?: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  allowPin?: boolean
}>(), {
  variant: 'secondary',
  allowPin: false,
})

const { toast } = useToast()
const { t } = useI18n()

const showPinned = ref<boolean>(false)
const sortBy = ref<Open5eSortBy>('name')
const type = ref<Open5eType>('spells')
const limit = 20
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })

const queryFilters = ref<Open5eFilters>({
  page: 0,
  search: debouncedSearch.value,
  ordering: sortBy.value,
})

watch([debouncedSearch, sortBy], () => {
  queryFilters.value = {
    page: 0,
    search: debouncedSearch.value,
    ordering: sortBy.value,
  }
})

watch(type, () => {
  queryFilters.value = {
    page: 0,
    search: '',
    ordering: 'name',
  }
})

const { data, status } = useOpen5eListing(computed(() => ({
  type: type.value,
  filters: queryFilters.value,
})))

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
        <FormKit
          v-model="search"
          :disabled="showPinned"
          type="search"
          :label="$t('components.inputs.nameLabel')"
          outer-class="$reset !pb-0 w-full sm:w-auto sm:flex-1"
        />
        <FormKit
          v-model="type"
          :disabled="showPinned"
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
          outer-class="$reset !pb-0 w-full sm:w-auto sm:flex-1"
          @input="search = ''"
        />
      </div>
      <AnimationReveal>
        <div
          v-if="sheet?.info_cards?.length"
          class="flex gap-2"
        >
          <button
            :aria-label="$t(`components.dndContentSearch.${showPinned ? 'hide' : 'show'}`)"
            :class="[showPinned ? 'btn-background' : 'btn-ghost text-muted-foreground']"
            class="flex items-center gap-x-2"
            @click="showPinned = !showPinned"
          >
            <Icon
              name="tabler:pin"
              class="size-4 min-w-4 text-foreground"
            />
            {{ $t(`components.dndContentSearch.${showPinned ? 'hide' : 'show'}`) }}
          </button>
          <button
            :aria-label="$t('components.dndContentSearch.remove')"
            class="btn-ghost flex items-center gap-x-2 text-muted-foreground"
            @click="removePins"
          >
            <Icon
              name="tabler:trash"
              class="size-4 min-w-4 text-foreground"
            />
            {{ $t('components.dndContentSearch.remove') }}
          </button>
        </div>
      </AnimationReveal>
    </div>

    <div class="overflow-y-auto">
      <MasonryGrid
        v-if="status === 'pending'"
        v-slot="{ column }"
        :data="Array.from({ length: 30 }, () => ({}))"
      >
        <SkeletonContentCard
          v-for="(_item, i) in column"
          :key="i"
          :variant="variant"
        />
      </MasonryGrid>
      <MasonryGrid
        v-else-if="data?.items?.length"
        v-slot="{ column }"
        :data="showPinned && sheet ? sheet?.info_cards : data.items"
      >
        <ContentCard
          v-for="(hit, j) in column"
          :id="j === 0 ? 'el' : ''"
          :key="hit.slug"
          :type="type"
          :hit="hit"
          :variant="variant"
          :allow-pin="allowPin"
          :pinned="sheet?.info_cards?.some(i => i.slug === hit.slug)"
          @pin="handlePinToggle(hit, false)"
          @unpin="handlePinToggle(hit, true)"
        />
      </MasonryGrid>
    </div>

    <Pagination
      v-if="data?.pages && data.pages > 1 && status !== 'pending' && data?.items?.length && !showPinned"
      v-model:page="queryFilters.page"
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
