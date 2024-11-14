<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate'

defineEmits<{
  paginate: [value: number]
  remove: []
}>()

const props = withDefaults(
  defineProps<{
    items: any[]
    headers: TableHeader[]
    pages?: number
    shadow?: boolean
    loading?: boolean
    select?: boolean
    type?: 'campaigns' | 'encounters'
    perPage?: number
  }>(), {
    pages: 0,
    shadow: false,
    loading: false,
    select: false,
    type: 'campaigns',
    perPage: 20,
  },
)

const { t } = useI18n()

const sortedBy = defineModel<string>('sortedBy', { required: true })
const sortACS = defineModel<boolean>('acs', { default: false, required: true })
const page = defineModel<number>('page', { default: 0 })
const search = defineModel<string>('search', { default: '' })

const selectedAll = ref<boolean>(false)
const selected = ref<any[]>([])

defineExpose({ toggleRow, toggleAll, toggleSort, selected })

function toggleSort(key: string): void {
  sortACS.value = key === sortedBy.value ? !sortACS.value : false
  sortedBy.value = key
}

function toggleRow(row: any): void {
  selectedAll.value = false
  selected.value = toggleArray(row, selected.value)

  if (selected.value.length === props.items.length) selectedAll.value = true
}

function toggleAll(): void {
  if (selected.value.length === props.items.length) selected.value = []
  else selected.value = props.items
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
              @click="items.length !== 0 && sort && !loading && toggleSort(id)"
            >
              <div
                class="flex gap-2 items-center w-fit px-2 rounded-lg transition-colors duration-300"
                :class="{ 'bg-slate-700': id === sortedBy }"
              >
                <span class="text-slate-300 hover:text-white transition-colors duration-300">
                  {{ label }}
                </span>
                <Icon
                  v-if="sort"
                  name="ph:arrows-down-up-bold"
                  class="w-5 h-5 text-secondary/50 transition-all duration-300"
                  :class="{
                    '!text-secondary': sortedBy === id,
                    'rotate-180': sortedBy === id && !sortACS,
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
            :total-items="items.length"
            :total-pages="pages"
            :loading="loading"
            :per-page="perPage"
            @paginate="$emit('paginate', $event)"
          />
        </div>
      </AnimationReveal>
      <div
        v-if="shadow"
        class="inset-0 z-[-1] fancy-shadow"
      />
    </div>
    <AnimationReveal>
      <button
        v-if="selected && selected.length"
        class="btn-danger mt-4"
        :aria-label="t('actions.bulkRemove', { number: 20 })"
        @click="$emit('remove')"
      >
        {{ t('actions.bulkRemove', { number: 20, type: t(`general.${type}`).toLowerCase() }) }}
      </button>
    </AnimationReveal>
  </section>
</template>
