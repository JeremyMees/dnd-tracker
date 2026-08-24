<script setup lang="ts">
const props = defineProps<{
  sheet?: PlayerSheet
  loading: boolean
}>()

const { ownRowId } = useLiveSeat()

const activeId = computed(() => {
  if (!props.sheet) return undefined

  return props.sheet.rows[props.sheet.activeIndex]?.id
})

const { listRef, setRowRef } = useLiveRowScroll(activeId)

const columns = computed(() => {
  const rows = props.sheet?.rows

  if (!rows) {
    return {
      hp: true,
      ac: true,
      status: true,
      conditions: true,
      deathSaves: true,
      concentration: true,
    }
  }

  return {
    hp: rows.some(row => isDefined(row.hitPoints)),
    ac: rows.some(row => isDefined(row.armorClass)),
    status: rows.some(row => !!row.healthBand),
    conditions: rows.some(row => row.conditions.length > 0),
    deathSaves: rows.some(row => !!row.deathSaves && ownRowId.value === row.id),
    concentration: rows.some(row => row.type !== 'lair'),
  }
})
</script>

<template>
  <div
    ref="listRef"
    test-id="list"
    class="flex-1 min-h-0 overflow-y-auto dnd-container py-6"
  >
    <div class="rounded-lg border-4 border-secondary bg-secondary/50">
      <UiTable>
        <UiTableHeader>
          <UiTableRow class="hover:bg-transparent">
            <UiTableHead test-id="header">
              {{ $t('components.encounterTable.headers.name') }}
            </UiTableHead>
            <UiTableHead test-id="header" class="w-16">
              {{ $t('components.encounterTable.headers.init') }}
            </UiTableHead>
            <UiTableHead v-if="columns.hp" test-id="header" class="w-20">
              {{ $t('components.encounterTable.headers.hp') }}
            </UiTableHead>
            <UiTableHead v-if="columns.ac" test-id="header" class="w-16">
              {{ $t('components.encounterTable.headers.ac') }}
            </UiTableHead>
            <UiTableHead v-if="columns.status" test-id="header" class="w-28">
              {{ $t('components.encounterTable.headers.status') }}
            </UiTableHead>
            <UiTableHead v-if="columns.conditions" test-id="header">
              {{ $t('components.encounterTable.headers.conditions') }}
            </UiTableHead>
            <UiTableHead
              v-if="columns.deathSaves"
              test-id="header"
              class="w-20"
            >
              {{ $t('components.encounterTable.headers.deathSaves') }}
            </UiTableHead>
            <UiTableHead
              v-if="columns.concentration"
              test-id="header"
              class="w-28"
            >
              {{ $t('components.encounterTable.headers.concentration') }}
            </UiTableHead>
          </UiTableRow>
        </UiTableHeader>

        <UiTableBody>
          <template v-if="sheet">
            <UiTableRow
              v-for="(row, index) in sheet.rows"
              :key="row.id"
              :ref="el => setRowRef(row.id, el)"
              test-id="row"
              :data-active="index === sheet.activeIndex"
              class="transition-colors duration-300"
              :class="{
                'bg-primary/10': index === sheet.activeIndex,
              }"
            >
              <UiTableCell class="p-2">
                <div class="flex items-center gap-2 min-w-0">
                  <Icon
                    :name="homebrewIcon(row.type)"
                    :class="homebrewColor(row.type)"
                    class="size-5 min-w-5"
                    aria-hidden="true"
                  />
                  <span test-id="name" class="font-bold truncate">
                    {{ row.name }}
                  </span>
                  <UiBadge
                    v-if="ownRowId === row.id"
                    test-id="own"
                    class="shrink-0"
                  >
                    {{ $t('general.you') }}
                  </UiBadge>
                </div>
              </UiTableCell>

              <UiTableCell class="p-2">
                <span v-if="row.initiative < 0" test-id="initiative-empty">
                  —
                </span>
                <span v-else test-id="initiative">
                  {{ row.initiative }}
                </span>
              </UiTableCell>

              <UiTableCell v-if="columns.hp" class="p-2">
                <LiveStatHp :row="row">
                  <span test-id="hp-hidden" class="text-muted-foreground">
                    &mdash;
                  </span>
                </LiveStatHp>
              </UiTableCell>

              <UiTableCell v-if="columns.ac" class="p-2">
                <LiveStatAc :row="row">
                  <span test-id="ac-hidden" class="text-muted-foreground">
                    &mdash;
                  </span>
                </LiveStatAc>
              </UiTableCell>

              <UiTableCell v-if="columns.status" class="p-2">
                <LiveStatHealthBand
                  v-if="row.healthBand"
                  :band="row.healthBand"
                />
              </UiTableCell>

              <UiTableCell v-if="columns.conditions" class="p-2">
                <div
                  v-if="row.conditions.length"
                  test-id="conditions"
                  class="flex flex-wrap gap-1"
                >
                  <UiBadge
                    v-for="condition in row.conditions"
                    :key="condition.name"
                  >
                    {{ condition.name }}
                    {{ condition.level ? `(${condition.level})` : '' }}
                  </UiBadge>
                </div>
              </UiTableCell>

              <UiTableCell v-if="columns.deathSaves" class="p-2">
                <LiveDeathSaves
                  v-if="row.deathSaves && ownRowId === row.id"
                  v-tippy="$t('general.deathSaves')"
                  test-id="death-saves"
                  :saves="row.deathSaves"
                  disabled
                />
              </UiTableCell>

              <UiTableCell v-if="columns.concentration" class="p-2">
                <LiveStatConcentration
                  v-if="row.type !== 'lair'"
                  test-id="concentration"
                  :data-active="row.concentration"
                  :active="row.concentration"
                />
              </UiTableCell>
            </UiTableRow>
          </template>

          <template v-else-if="loading">
            <SkeletonLiveRowTableRow
              v-for="i in 6"
              :key="i"
              test-id="loading"
            />
          </template>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
