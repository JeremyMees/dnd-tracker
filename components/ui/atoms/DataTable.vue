<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate'

defineEmits<{
  paginate: [value: number]
  remove: [items: number[]]
}>()

const props = withDefaults(
  defineProps<{
    items: any[]
    headers: TableHeader[]
    pages: number
    perPage: number
    totalItems: number
    type: 'campaign' | 'encounter' | 'homebrew' | 'note'
    loading?: boolean
    select?: boolean
    hasRights?: boolean
  }>(), {
    loading: false,
    select: false,
    hasRights: undefined,
  },
)

const sortBy = defineModel<string>('sortBy', { required: true })
const sortACS = defineModel<boolean>('acs', { default: true, required: true })
const page = defineModel<number>('page', { default: 0 })
const search = defineModel<string>('search', { default: '' })

const profile = useProfile()

const selectedAll = ref<boolean>(false)
const selected = ref<any[]>([])
const detailRow = ref<number>()

defineExpose({
  toggleRow,
  toggleAll,
  toggleSort,
  toggleDetailRow,
  selected,
  detailRow,
})

function toggleSort(key: string): void {
  if (!props.items.length && props.loading) return

  sortACS.value = key === sortBy.value ? !sortACS.value : false
  sortBy.value = key
  selectedAll.value = false
  selected.value = []
}

function toggleDetailRow(id: number): void {
  if (detailRow.value === id) detailRow.value = undefined
  else detailRow.value = id
}

function toggleRow(row: any): void {
  selectedAll.value = false
  selected.value = toggleArray(row, selected.value)

  if (selected.value.length === props.items.length) selectedAll.value = true
}

function toggleAll(): void {
  const itemsWithRights = props.items.filter((item) => {
    if (props.hasRights !== undefined) return props.hasRights

    const owner = isOwner(item, profile.user!.id, true)

    return props.type === 'campaign'
      ? owner
      : owner || isAdmin(item, profile.user!.id, true)
  })

  if (selected.value.length === itemsWithRights.length) selected.value = []
  else selected.value = itemsWithRights
}
</script>

<template>
  <section class="inline-block overflow-x-auto overflow-y-hidden w-full">
    <div class="bg-slate-700/50 border-4 border-slate-700 rounded-lg relative overflow-y-hidden">
      <div class="p-2 flex justify-between gap-8">
        <FormKit
          v-model="search"
          type="search"
          suffix-icon="search"
          outer-class="$reset !pb-0 max-w-[300px]"
        />
        <div class="flex gap-4 items-center">
          <slot name="header" />
        </div>
      </div>
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-slate-700">
            <th
              v-if="select"
              class="td"
            >
              <FormKit
                v-model="selectedAll"
                type="checkbox"
                :disabled="loading || !items.length"
                outer-class="$reset !pb-0"
                wrapper-class="$remove:mb-0"
                decorator-class="$remove:mr-2"
                @click="toggleAll"
              />
            </th>
            <th
              v-for="{ label, sort, id } in headers"
              :key="label"
              class="py-2"
              :class="{
                'cursor-pointer': sort,
                '!cursor-progress': loading,
                '!cursor-not-allowed': items.length === 0,
              }"
              @click="sort && toggleSort(id)"
            >
              <div
                class="flex gap-2 items-center w-fit px-2 rounded-lg transition-colors duration-300"
                :class="{ 'bg-slate-700': id === sortBy }"
              >
                <span class="text-slate-300 hover:text-white transition-colors duration-300">
                  {{ label }}
                </span>
                <Icon
                  v-if="sort"
                  name="tabler:arrows-sort"
                  class="w-5 h-5 text-secondary/50 transition-all duration-300"
                  :class="{
                    '!text-secondary': sortBy === id,
                    'rotate-180': sortBy === id && !sortACS,
                  }"
                  aria-hidden="true"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody v-auto-animate>
          <slot :rows="items" />

          <tr
            v-if="!items || !items.length"
            class="py-20"
          >
            <td
              :colspan="select ? headers.length + 1 : headers.length"
              class="py-20 px-5 font-bold"
            >
              <div class="max-w-prose mx-auto text-center">
                <slot name="empty" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <AnimationReveal>
        <div
          v-if="pages > 1"
          class="flex justify-end p-2"
        >
          <TablePagination
            v-model:page="page"
            :total-items="totalItems"
            :total-pages="pages"
            :loading="loading"
            :per-page="perPage"
            @paginate="e => {
              selectedAll = false
              selected = []
              $emit('paginate', e)
            }"
          />
        </div>
      </AnimationReveal>
      <div class="inset-0 z-[-1] fancy-shadow" />
    </div>
    <AnimationReveal>
      <button
        v-if="selected && selected.length"
        class="btn-danger mt-4"
        :aria-label="$t('actions.bulkRemove', { number: selected.length })"
        @click="() => {
          $emit('remove', selected.map(item => item.id))
          selectedAll = false
          selected = []
        }"
      >
        {{
          $t('actions.bulkRemove', {
            number: selected.length,
            type: $t(`general.${type}`, (selected || []).length).toLowerCase(),
          })
        }}
      </button>
    </AnimationReveal>
  </section>
</template>
