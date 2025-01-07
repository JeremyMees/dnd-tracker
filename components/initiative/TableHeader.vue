<script setup lang="ts">
defineEmits<{
  update: [object: Omit<Partial<InitiativeSheet>, NotUpdatable> ]
  openQuickInit: []
}>()

defineProps<{
  data: InitiativeSheet
  columns: string[]
}>()
</script>

<template>
  <thead>
    <tr
      class="grid items-center text-left text-medium"
      :style="{
        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
      }"
    >
      <th
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.name') }}
      </th>
      <th
        scope="col"
        class="py-2 uppercase flex items-center"
      >
        {{ $t('components.encounterTable.headers.init') }}
        <button
          v-tippy="$t('components.encounterTable.quick')"
          :aria-label="$t('components.encounterTable.quick')"
          :disabled="!data.rows.length"
          class="icon-btn-secondary group"
          @click="$emit('openQuickInit')"
        >
          <Icon
            id="tour-12"
            name="tabler:sparkles"
            class="!size-4 text-secondary"
            aria-hidden="true"
          />
        </button>
      </th>
      <th
        v-if="columns.includes('ac')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.ac') }}
      </th>
      <th
        v-if="columns.includes('health')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.health') }}
      </th>
      <th
        v-if="columns.includes('manage')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.manage') }}
      </th>
      <th
        v-if="columns.includes('conditions')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.conditions') }}
      </th>
      <th
        v-if="columns.includes('note')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.note') }}
      </th>
      <th
        v-if="columns.includes('deathSaves')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.deathSaves') }}
      </th>
      <th
        v-if="columns.includes('concentration')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.concentration') }}
      </th>
      <th
        v-if="columns.includes('modify')"
        scope="col"
        class="py-2 uppercase"
      >
        {{ $t('components.encounterTable.headers.modify') }}
      </th>
    </tr>
  </thead>
</template>
