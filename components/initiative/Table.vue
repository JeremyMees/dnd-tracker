<script setup lang="ts">
const props = defineProps<{
  data: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (e) => {
  e.preventDefault()

  if (!e.shiftKey && !e.metaKey) return

  const current = props.data.rows[props.data.activeIndex].id

  if (e.key === 'Enter') collapsedRow.value = collapsedRow.value === current ? undefined : current
  else if (e.key === 'ArrowLeft') previous()
  else if (e.key === 'ArrowRight') next()
})

const visibleColumns = computed<string[]>(() => {
  return props.data.settings.modified
    ? [...(props.data.settings.rows || []), 'name', 'init']
    : ['name', 'init', 'health', 'ac', 'manage', 'conditions', 'deathSaves', 'notes', 'concentration', 'modify']
})

const collapsedRow = ref<string>()

function previous(): void {
  const isAtStart = props.data.activeIndex === 0

  props.update({
    activeIndex: isAtStart ? props.data.rows.length - 1 : props.data.activeIndex - 1,
    round: isAtStart ? props.data.round - 1 : props.data.round,
  })
}

function next(): void {
  const isAtEnd = props.data.activeIndex + 1 >= props.data.rows.length

  props.update({
    activeIndex: isAtEnd ? 0 : props.data.activeIndex + 1,
    round: isAtEnd ? props.data.round + 1 : props.data.round,
  })
}
</script>

<template>
  <div class="flex flex-col gap-2 relative">
    <InitiativePet
      v-if="data?.settings?.pet"
      :pet="data.settings.pet"
      class="absolute top-20 sm:top-10 left-4"
    />
    <div
      v-if="data"
      class="space-y-6 body-small h-full"
    >
      <InitiativeHeader
        :data="data"
        @reset="update({ round: 1, activeIndex: 0 })"
        @previous="previous"
        @next="next"
      />
      <div class="relative w-full overflow-auto rounded-lg bg-foreground">
        <table class="w-full">
          <thead>
            <tr :class="`spacing-${props.data.settings.spacing || 'normal'}`">
              <th />
              <th>
                {{ $t('components.encounterTable.headers.name') }}
              </th>
              <th class="flex items-center">
                {{ $t('components.encounterTable.headers.init') }}
                <button
                  v-tippy="$t('components.encounterTable.quick')"
                  :aria-label="$t('components.encounterTable.quick')"
                  :disabled="!data.rows.length"
                  class="icon-btn-tertiary group"
                  @click="console.log('open quick init')"
                >
                  <Icon
                    id="tour-12"
                    name="tabler:sparkles"
                    class="!size-4 text-tertiary"
                    aria-hidden="true"
                  />
                </button>
              </th>
              <th v-if="visibleColumns.includes('ac')">
                {{ $t('components.encounterTable.headers.ac') }}
              </th>
              <th v-if="visibleColumns.includes('health')">
                {{ $t('components.encounterTable.headers.health') }}
              </th>
              <th v-if="visibleColumns.includes('manage')">
                {{ $t('components.encounterTable.headers.manage') }}
              </th>
              <th v-if="visibleColumns.includes('conditions')">
                {{ $t('components.encounterTable.headers.conditions') }}
              </th>
              <th v-if="visibleColumns.includes('note')">
                {{ $t('components.encounterTable.headers.note') }}
              </th>
              <th v-if="visibleColumns.includes('deathSaves')">
                {{ $t('components.encounterTable.headers.deathSaves') }}
              </th>
              <th v-if="visibleColumns.includes('concentration')">
                {{ $t('components.encounterTable.headers.concentration') }}
              </th>
              <th v-if="visibleColumns.includes('modify')" />
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(row, index) in data?.rows"
              :key="row.id"
            >
              <tr
                :class="[
                  `spacing-${data.settings.spacing || 'normal'}`,
                  { 'border !border-primary': index === data.activeIndex },
                ]"
                class="border-t border-secondary transition-all duration-200 ease-in-out"
              >
                <td>
                  <button
                    v-tippy="$t(`actions.${collapsedRow === row.id ? 'hide' : 'show'}`)"
                    :aria-label="$t(`actions.${collapsedRow === row.id ? 'hide' : 'show'}`)"
                    :class="collapsedRow === row.id ? 'icon-btn-destructive' : 'icon-btn-help'"
                    @click="collapsedRow = collapsedRow === row.id ? undefined : row.id"
                  >
                    <Icon
                      name="tabler:chevron-right"
                      aria-hidden="true"
                      :class="{ 'rotate-90': collapsedRow === row.id }"
                      class="transition-transform duration-200 ease-in-out"
                    />
                  </button>
                </td>
                <InitiativeTableRowName
                  v-if="visibleColumns.includes('name')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                />
                <InitiativeTableRowInit
                  v-if="visibleColumns.includes('init')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                  @open-info="console.log('open update modal with name, init, ac, hp and type')"
                />
                <InitiativeTableRowHealth
                  v-if="visibleColumns.includes('health')"
                  :item="row"
                  @open-info="console.log('open update modal with name, init, ac, hp and type')"
                />
                <InitiativeTableRowAc
                  v-if="visibleColumns.includes('ac')"
                  :item="row"
                  @open-info="console.log('open update modal with name, init, ac, hp and type')"
                />
                <InitiativeTableRowActions
                  v-if="visibleColumns.includes('manage')"
                  :item="row"
                  @open-hp="console.log('open hp modal')"
                  @open-ac="console.log('open ac modal')"
                  @open-condition="console.log('open condition modal')"
                  @open-link="console.log('open link modal')"
                />
                <InitiativeTableRowConditions
                  v-if="visibleColumns.includes('conditions')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                  @open-conditions="console.log('open update modal with conditions')"
                />
                <InitiativeTableRowNotes
                  v-if="visibleColumns.includes('note')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                />
                <InitiativeTableRowDeathSaves
                  v-if="visibleColumns.includes('deathSaves')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                />
                <InitiativeTableRowConcentration
                  v-if="visibleColumns.includes('concentration')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                />
                <InitiativeTableRowModify
                  v-if="visibleColumns.includes('modify')"
                  :item="row"
                  :sheet="data"
                  :update="update"
                />
              </tr>
              <tr
                v-if="collapsedRow === row.id"
                class="tr"
              >
                <td
                  class="td space-y-4 w-full"
                  :colspan="visibleColumns.length + 1"
                >
                  <div class="max-h-[350px] sm:max-h-[600px] overflow-y-auto">
                    <ActionsTable
                      v-if="row.actions?.length || row.legendary_actions?.length || row.reactions?.length || row.special_abilities?.length"
                      :actions="row.actions"
                      :legendary-actions="row.legendary_actions"
                      :reactions="row.reactions"
                      :special-abilities="row.special_abilities"
                    />
                    <p
                      v-else
                      class="text-muted-foreground"
                    >
                      {{ $t('components.encounterTable.noActions') }}
                    </p>
                  </div>
                  <div class="flex justify-end">
                    <button
                      class="btn-destructive"
                      :aria-label="$t('actions.close')"
                      @click="collapsedRow = undefined"
                    >
                      {{ $t('actions.close') }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
tr.spacing-normal td {
  @apply p-3;
}

tr.spacing-cozy td {
  @apply py-4 px-5;
}

tr.spacing-compact td {
  @apply py-3 px-1;
}

td {
  @apply align-middle;
}

tr.spacing-normal th {
  @apply p-3;
}

tr.spacing-cozy th {
  @apply py-4 px-5;
}

tr.spacing-compact th {
  @apply py-3 px-1;
}

th {
  @apply h-12 px-4 text-left align-middle font-medium;
}
</style>
